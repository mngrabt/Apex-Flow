-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', true),
  ('files', 'files', true);

-- Create policies for storage
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (auth.uid() = owner);

-- Create enum types
CREATE TYPE user_role AS ENUM ('A', 'S');
CREATE TYPE tender_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE request_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE object_type AS ENUM ('office', 'construction');
CREATE TYPE request_type AS ENUM ('transfer', 'cash');

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL,
  date DATE NOT NULL,
  department TEXT NOT NULL,
  type request_type NOT NULL,
  status request_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  document_url TEXT
);

-- Create request items table
CREATE TABLE public.request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  object_type object_type,
  unit_type TEXT,
  quantity INTEGER NOT NULL,
  deadline INTEGER,
  total_sum DECIMAL(15,2)
);

-- Create request signatures table
CREATE TABLE public.request_signatures (
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (request_id, user_id)
);

-- Create tenders table
CREATE TABLE public.tenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id),
  status tender_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  delivery_time INTEGER NOT NULL,
  price_per_unit DECIMAL(15,2) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  include_tax BOOLEAN NOT NULL DEFAULT false,
  proposal_url TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  categories TEXT[]
);

-- Create RLS policies

-- Users policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'A'));

CREATE POLICY "Only admins can update users"
  ON public.users FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'A'));

-- Requests policies
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all requests"
  ON public.requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only creator or admin can update request"
  ON public.requests FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'A')
  );

-- Request items policies
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all request items"
  ON public.request_items FOR SELECT
  USING (true);

CREATE POLICY "Users can create request items"
  ON public.request_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests 
      WHERE id = request_id AND created_by = auth.uid()
    )
  );

-- Request signatures policies
ALTER TABLE public.request_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all signatures"
  ON public.request_signatures FOR SELECT
  USING (true);

CREATE POLICY "Users can sign requests"
  ON public.request_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tenders policies
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tenders"
  ON public.tenders FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create tenders"
  ON public.tenders FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'A')
  );

CREATE POLICY "Only admins can update tenders"
  ON public.tenders FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'A')
  );

-- Suppliers policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all suppliers"
  ON public.suppliers FOR SELECT
  USING (true);

CREATE POLICY "Suppliers can create their own entries"
  ON public.suppliers FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'S')
  );

CREATE POLICY "Suppliers can update their own entries"
  ON public.suppliers FOR UPDATE
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'A')
  );

CREATE POLICY "Only creator or admin can delete supplier"
  ON public.suppliers FOR DELETE
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'A')
  );

-- Create indexes for better performance
CREATE INDEX idx_requests_created_by ON public.requests(created_by);
CREATE INDEX idx_request_items_request_id ON public.request_items(request_id);
CREATE INDEX idx_request_signatures_request_id ON public.request_signatures(request_id);
CREATE INDEX idx_tenders_request_id ON public.tenders(request_id);
CREATE INDEX idx_suppliers_tender_id ON public.suppliers(tender_id);
CREATE INDEX idx_suppliers_created_by ON public.suppliers(created_by);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name, position, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'S')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'position', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 