-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('S', 'B', 'A')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT,
    date TIMESTAMP WITH TIME ZONE,
    department TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'transfer',
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'draft',
    categories TEXT[] DEFAULT '{}',
    document_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create request_items table
CREATE TABLE request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    object_type TEXT,
    unit_type TEXT,
    quantity INTEGER,
    deadline INTEGER,
    amount NUMERIC,
    total_sum NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create request_signatures table
CREATE TABLE request_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, user_id)
);

-- Create tenders table
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'completed', 'cancelled')) DEFAULT 'draft',
    winner_id UUID,
    winner_reason TEXT,
    reserve_winner_id UUID,
    reserve_winner_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    include_tax BOOLEAN DEFAULT false,
    delivery_time INTEGER,
    contact_person TEXT,
    contact_number TEXT,
    proposal_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create protocols table
CREATE TABLE protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    finance_status TEXT NOT NULL CHECK (finance_status IN ('not_submitted', 'waiting', 'paid')) DEFAULT 'not_submitted',
    urgency TEXT CHECK (urgency IN ('high', 'low')),
    number TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create protocol_signatures table
CREATE TABLE protocol_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(protocol_id, user_id)
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    document_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to handle cash request workflow
CREATE OR REPLACE FUNCTION process_cash_request()
RETURNS trigger AS $$
BEGIN
  -- If it's a cash request and has all required signatures
  IF (
    SELECT type = 'cash'
    FROM requests
    WHERE id = NEW.request_id
  ) AND (
    SELECT COUNT(DISTINCT user_id) = 3
    FROM request_signatures
    WHERE request_id = NEW.request_id
    AND user_id IN (
      '00000000-0000-0000-0000-000000000001', -- Abdurauf
      '00000000-0000-0000-0000-000000000003', -- Fozil
      '00000000-0000-0000-0000-000000000004'  -- Aziz
    )
  ) THEN
    -- Set the date when all signatures are collected
    UPDATE requests
    SET 
      date = NOW(),
      status = 'approved'
    WHERE id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cash request workflow
DROP TRIGGER IF EXISTS cash_request_workflow ON request_signatures;
CREATE TRIGGER cash_request_workflow
AFTER INSERT OR UPDATE ON request_signatures
FOR EACH ROW
EXECUTE FUNCTION process_cash_request();

-- Insert default users
INSERT INTO users (id, username, name, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'abdurauf', 'Abdurauf', 'A'),
    ('00000000-0000-0000-0000-000000000002', 'jamshid', 'Jamshid', 'B'),
    ('00000000-0000-0000-0000-000000000003', 'fozil', 'Fozil', 'B'),
    ('00000000-0000-0000-0000-000000000004', 'aziz', 'Aziz', 'B'),
    ('00000000-0000-0000-0000-000000000005', 'supplier1', 'Supplier 1', 'S'),
    ('00000000-0000-0000-0000-000000000006', 'supplier2', 'Supplier 2', 'S')
ON CONFLICT (id) DO NOTHING; 