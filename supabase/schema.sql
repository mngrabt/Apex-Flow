-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS archived_protocols CASCADE;
DROP TABLE IF EXISTS protocol_signatures CASCADE;
DROP TABLE IF EXISTS protocols CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS request_signatures CASCADE;
DROP TABLE IF EXISTS request_items CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS database_suppliers CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS supplier_applications CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('A', 'B', 'C', 'D', 'S')),
  signature_url TEXT,
  telegram_chat_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supplier applications table
CREATE TABLE supplier_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  telegram_number TEXT,
  is_telegram_same BOOLEAN DEFAULT false,
  telegram_chat_id BIGINT,
  is_vat_payer BOOLEAN NOT NULL,
  vat_certificate_url TEXT,
  category TEXT NOT NULL,
  license_url TEXT,
  passport_url TEXT,
  form_url TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  username TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);

-- Rest of the tables...
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  document_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY,
  number TEXT,
  date TIMESTAMPTZ,
  department TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'tender', 'protocol', 'archived')),
  document_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE request_items (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  object_type TEXT NOT NULL CHECK (object_type IN ('office', 'construction')),
  unit_type TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  deadline INTEGER NOT NULL CHECK (deadline > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE request_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, user_id)
);

CREATE TABLE tenders (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  winner_id UUID,
  winner_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  delivery_time INTEGER NOT NULL CHECK (delivery_time > 0),
  price_per_unit DECIMAL(15, 2),
  price DECIMAL(15, 2),
  include_tax BOOLEAN DEFAULT false,
  proposal_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenders 
  ADD CONSTRAINT fk_tenders_winner 
  FOREIGN KEY (winner_id) 
  REFERENCES suppliers(id) 
  ON DELETE SET NULL;

CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  finance_status TEXT CHECK (finance_status IN ('not_submitted', 'waiting', 'paid')),
  urgency TEXT CHECK (urgency IN ('high', 'low')),
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE protocol_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (protocol_id, user_id)
);

CREATE TABLE archived_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  zip_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE database_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'pending')),
  notifications_enabled BOOLEAN DEFAULT true,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_by ON requests(created_by);
CREATE INDEX idx_request_items_request_id ON request_items(request_id);
CREATE INDEX idx_request_signatures_request_id ON request_signatures(request_id);
CREATE INDEX idx_request_signatures_user_id ON request_signatures(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_request_id ON tenders(request_id);
CREATE INDEX idx_suppliers_tender_id ON suppliers(tender_id);
CREATE INDEX idx_suppliers_created_by ON suppliers(created_by);
CREATE INDEX idx_protocols_status ON protocols(status);
CREATE INDEX idx_protocols_finance_status ON protocols(finance_status);
CREATE INDEX idx_protocols_tender_id ON protocols(tender_id);
CREATE INDEX idx_protocol_signatures_protocol_id ON protocol_signatures(protocol_id);
CREATE INDEX idx_protocol_signatures_user_id ON protocol_signatures(user_id);
CREATE INDEX idx_archived_protocols_protocol_id ON archived_protocols(protocol_id);
CREATE INDEX idx_calendar_events_protocol_id ON calendar_events(protocol_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_completed ON calendar_events(completed);
CREATE INDEX idx_database_suppliers_category ON database_suppliers(category);
CREATE INDEX idx_database_suppliers_status ON database_suppliers(status);
CREATE INDEX idx_supplier_applications_status ON supplier_applications(status);
CREATE INDEX idx_supplier_applications_created_at ON supplier_applications(created_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for all users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON tasks FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON requests FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON request_items FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON request_signatures FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON tenders FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON suppliers FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON protocols FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON protocol_signatures FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON archived_protocols FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON calendar_events FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON database_suppliers FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON supplier_applications FOR ALL USING (true);