-- Enable the tender notification trigger
ALTER TABLE tenders ENABLE TRIGGER notify_suppliers_of_new_tender_trigger;

-- Log the trigger enablement
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'enable_tender_trigger',
    'Enabled tender notification trigger',
    jsonb_build_object(
        'trigger_name', 'notify_suppliers_of_new_tender_trigger',
        'table', 'tenders'
    )
); 