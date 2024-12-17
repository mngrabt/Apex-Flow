-- Get all tables, columns, and their properties
WITH RECURSIVE fk_tree AS (
    SELECT  DISTINCT
        tc.table_schema,
        tc.constraint_name,
        tc.table_name AS dependent_table,
        kcu.column_name AS dependent_column,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        1 AS level
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name 
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
)
SELECT json_build_object(
    'database_info', (
        SELECT json_build_object(
            'version', version(),
            'current_database', current_database(),
            'current_schema', current_schema()
        )
    ),
    'schemas', (
        SELECT json_agg(json_build_object(
            'schema_name', schema_name,
            'owner', schema_owner
        ))
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
    ),
    'tables', (
        SELECT json_agg(json_build_object(
            'table_name', tables.table_name,
            'columns', (
                SELECT json_agg(json_build_object(
                    'column_name', columns.column_name,
                    'data_type', columns.data_type,
                    'is_nullable', columns.is_nullable,
                    'column_default', columns.column_default,
                    'character_maximum_length', columns.character_maximum_length
                ) ORDER BY ordinal_position)
                FROM information_schema.columns
                WHERE columns.table_name = tables.table_name
                AND columns.table_schema = 'public'
            ),
            'primary_keys', (
                SELECT json_agg(json_build_object(
                    'constraint_name', tc.constraint_name,
                    'column_name', kcu.column_name
                ))
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_name = tables.table_name
                AND tc.table_schema = 'public'
            ),
            'foreign_keys', (
                SELECT json_agg(json_build_object(
                    'constraint_name', fk.constraint_name,
                    'column', fk.dependent_column,
                    'references_table', fk.referenced_table,
                    'references_column', fk.referenced_column
                ))
                FROM fk_tree fk
                WHERE fk.dependent_table = tables.table_name
            ),
            'unique_constraints', (
                SELECT json_agg(json_build_object(
                    'constraint_name', tc.constraint_name,
                    'column_name', kcu.column_name
                ))
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'UNIQUE'
                AND tc.table_name = tables.table_name
                AND tc.table_schema = 'public'
            ),
            'check_constraints', (
                SELECT json_agg(json_build_object(
                    'constraint_name', tc.constraint_name,
                    'check_clause', cc.check_clause
                ))
                FROM information_schema.table_constraints tc
                JOIN information_schema.check_constraints cc 
                    ON tc.constraint_name = cc.constraint_name
                WHERE tc.constraint_type = 'CHECK'
                AND tc.table_name = tables.table_name
                AND tc.table_schema = 'public'
            ),
            'indexes', (
                SELECT json_agg(json_build_object(
                    'index_name', indexname,
                    'index_def', indexdef
                ))
                FROM pg_indexes
                WHERE tablename = tables.table_name
                AND schemaname = 'public'
            ),
            'policies', (
                SELECT json_agg(json_build_object(
                    'policy_name', pol.policyname,
                    'policy_action', pol.cmd,
                    'policy_roles', pol.roles,
                    'policy_qual', pol.qual,
                    'policy_with_check', pol.with_check
                ))
                FROM pg_policies pol
                WHERE pol.tablename = tables.table_name
                AND pol.schemaname = 'public'
            ),
            'triggers', (
                SELECT json_agg(json_build_object(
                    'trigger_name', trigger_name,
                    'event_manipulation', event_manipulation,
                    'action_statement', action_statement,
                    'action_timing', action_timing
                ))
                FROM information_schema.triggers
                WHERE event_object_table = tables.table_name
                AND trigger_schema = 'public'
            ),
            'row_level_security', (
                SELECT json_build_object(
                    'has_rls', rel.relrowsecurity,
                    'force_rls', rel.relforcerowsecurity
                )
                FROM pg_class rel
                WHERE rel.relname = tables.table_name
                AND rel.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            )
        ))
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    ),
    'views', (
        SELECT json_agg(json_build_object(
            'view_name', viewname,
            'view_definition', definition
        ))
        FROM pg_views
        WHERE schemaname = 'public'
    ),
    'functions', (
        SELECT json_agg(json_build_object(
            'function_name', p.proname,
            'function_args', pg_get_function_arguments(p.oid),
            'function_returns', pg_get_function_result(p.oid),
            'function_body', pg_get_functiondef(p.oid)
        ))
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ),
    'extensions', (
        SELECT json_agg(json_build_object(
            'extension_name', extname,
            'extension_version', extversion
        ))
        FROM pg_extension
    ),
    'roles', (
        SELECT json_agg(json_build_object(
            'role_name', rolname,
            'role_super', rolsuper,
            'role_inherit', rolinherit,
            'role_create_role', rolcreaterole,
            'role_create_db', rolcreatedb,
            'role_can_login', rolcanlogin
        ))
        FROM pg_roles
    )
) as database_structure; 