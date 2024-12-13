-- Create storage buckets if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
        ('documents', 'documents', true, 10485760, ARRAY[
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/heic',
            'image/heif',
            'text/html'
        ]);
    END IF;
END $$;

-- Enable RLS policies for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" ON storage.objects
            FOR SELECT USING (bucket_id = 'documents');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated uploads'
    ) THEN
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'documents' 
                AND auth.role() = 'authenticated'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated deletes'
    ) THEN
        CREATE POLICY "Allow authenticated deletes" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'documents' 
                AND auth.role() = 'authenticated'
            );
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;