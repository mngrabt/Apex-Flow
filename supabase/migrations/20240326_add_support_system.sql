-- Drop support system tables
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_tickets;
DROP FUNCTION IF EXISTS update_support_ticket_updated_at CASCADE;