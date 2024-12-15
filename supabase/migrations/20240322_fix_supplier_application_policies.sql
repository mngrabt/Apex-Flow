-- Fix supplier application policies
DROP FUNCTION IF EXISTS approve_supplier_application(application_id UUID, reviewer_id UUID);

-- Create a security definer function to handle application approval
CREATE OR REPLACE FUNCTION approve_supplier_application(application_id UUID, reviewer_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_application RECORD;
BEGIN
    -- Get the application details
    SELECT * INTO v_application
    FROM supplier_applications
    WHERE id = application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Create supplier in database_suppliers
    INSERT INTO database_suppliers (
        name,
        categories,
        status,
        notifications_enabled,
        contact_person,
        phone,
        email,
        inn,
        vat_certificate_url,
        license_url,
        passport_url,
        form_url,
        telegram_chat_id
    ) VALUES (
        v_application.company_name,
        v_application.categories,
        'verified',
        true,
        v_application.contact_person,
        v_application.contact_number,
        v_application.email,
        v_application.inn,
        v_application.vat_certificate_url,
        v_application.license_url,
        v_application.passport_url,
        v_application.form_url,
        v_application.telegram_chat_id
    );

    -- Create user account
    INSERT INTO users (
        id,
        username,
        password,
        name,
        role,
        telegram_chat_id,
        categories,
        notifications_enabled
    ) VALUES (
        gen_random_uuid(),
        v_application.username,
        v_application.password,
        v_application.contact_person,
        'S',
        v_application.telegram_chat_id,
        v_application.categories,
        true
    );

    -- Update application status
    UPDATE supplier_applications
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = reviewer_id
    WHERE id = application_id;

    -- Log the approval
    INSERT INTO debug_logs (function_name, message, details)
    VALUES (
        'approve_supplier_application',
        'Supplier application approved successfully',
        jsonb_build_object(
            'application_id', application_id,
            'reviewer_id', reviewer_id,
            'company_name', v_application.company_name
        )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_supplier_application(UUID, UUID) TO authenticated;

-- Log the function creation
INSERT INTO debug_logs (function_name, message, details)
VALUES (
    'fix_supplier_application_policies',
    'Created secure application approval function',
    jsonb_build_object(
        'function', 'approve_supplier_application',
        'type', 'SECURITY DEFINER'
    )
); 