-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table and type if they exist
DROP TABLE IF EXISTS public.calendar_events;
DROP TYPE IF EXISTS calendar_event_status;

-- Create calendar event status enum
CREATE TYPE calendar_event_status AS ENUM ('scheduled', 'unassigned', 'completed');

-- Create calendar_events table
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    status calendar_event_status NOT NULL DEFAULT 'unassigned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "protocolId" UUID
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Only admins can create calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Only admins can update calendar events" ON public.calendar_events;

-- Create policies
CREATE POLICY "Enable all access to calendar_events"
    ON public.calendar_events
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create indexes
DROP INDEX IF EXISTS idx_calendar_events_protocol_id;
DROP INDEX IF EXISTS idx_calendar_events_status;
CREATE INDEX idx_calendar_events_protocol_id ON public.calendar_events("protocolId");
CREATE INDEX idx_calendar_events_status ON public.calendar_events(status); 