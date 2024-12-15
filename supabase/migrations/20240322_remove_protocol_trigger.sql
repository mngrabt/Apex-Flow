-- Drop the trigger and function for archived protocols
DROP TRIGGER IF EXISTS protocol_archive_notification_trigger ON archived_protocols;
DROP FUNCTION IF EXISTS handle_protocol_archive_notification();

-- Drop the component checker trigger if it exists
DROP TRIGGER IF EXISTS protocol_number_checker_trigger ON protocols;
DROP FUNCTION IF EXISTS handle_protocol_number_checker() CASCADE; 