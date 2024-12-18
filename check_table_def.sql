-- Get table definition
SELECT 
    pg_get_tabledef('requests'::regclass) as table_definition; 