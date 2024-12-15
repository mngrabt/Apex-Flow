-- Function to toggle notifications without trigger recursion
CREATE OR REPLACE FUNCTION toggle_notification_raw(supplier_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Direct SQL update without trigger execution
    EXECUTE format('UPDATE database_suppliers SET notifications_enabled = NOT COALESCE(notifications_enabled, false) WHERE id = %L', supplier_id);
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 