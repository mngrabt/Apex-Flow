-- Drop duplicate triggers
DROP TRIGGER IF EXISTS notify_cash_request_completion_trigger ON requests;
DROP TRIGGER IF EXISTS cash_request_completion_trigger ON requests;
DROP TRIGGER IF EXISTS cash_protocol_number_notification_trigger ON requests;

-- Keep only these essential triggers with proper conditions
CREATE OR REPLACE TRIGGER notify_protocol_status_trigger
    AFTER UPDATE OF status ON requests
    FOR EACH ROW
    WHEN (NEW.type != 'cash')  -- Skip cash requests
    EXECUTE FUNCTION notify_protocol_status();

CREATE OR REPLACE TRIGGER cash_request_completion_trigger
    AFTER UPDATE OF status ON requests
    FOR EACH ROW
    WHEN (NEW.type = 'cash')  -- Only for cash requests
    EXECUTE FUNCTION notify_cash_request_completion();

CREATE OR REPLACE TRIGGER create_cash_protocol_trigger
    AFTER UPDATE OF status ON requests
    FOR EACH ROW
    WHEN (NEW.type = 'cash' AND NEW.status = 'protocol')
    EXECUTE FUNCTION create_cash_protocol(); 