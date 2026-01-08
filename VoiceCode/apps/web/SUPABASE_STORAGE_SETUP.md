# Supabase Storage Setup Guide

This document explains how to set up Supabase Storage for audio file uploads in VoiceFlow PRO.

## Prerequisites

- Supabase project created at https://supabase.com
- Supabase URL and anon key configured in `.env` file

## Create Storage Bucket

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `audio-files`
   - **Public bucket**: ✅ Enabled (for easy public URL access)
   - **File size limit**: 50 MB (recommended)
   - **Allowed MIME types**: `audio/*, video/*`

### Option 2: Using SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true);

-- Set up Row Level Security (RLS) policies

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read their own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access (if you want files to be publicly accessible)
CREATE POLICY "Public can read audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-files');
```

## File Organization

Audio files are organized in the bucket using the following structure:

```
audio-files/
  ├── {user_id}/
  │   ├── {timestamp}-{filename}.mp3
  │   ├── {timestamp}-{filename}.wav
  │   └── ...
  ├── {another_user_id}/
  │   └── ...
```

## Security Policies

The setup includes Row Level Security (RLS) policies that:

1. **Upload**: Users can only upload files to their own folder (`{user_id}/`)
2. **Read**: Users can read their own files
3. **Delete**: Users can delete their own files
4. **Public Read** (optional): Anyone can read files if public access is enabled

## File Upload Flow

1. User selects audio file(s) in the UI
2. Files are added to the processing queue
3. Service uploads file to Supabase Storage:
   - Path: `{user_id}/{timestamp}-{filename}`
   - Bucket: `audio-files`
4. Public URL is generated and stored in the transcript metadata
5. File is transcribed using AIML API
6. Transcript is saved to database with reference to audio URL

## Environment Variables

Make sure these variables are set in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Storage Upload

You can test the storage upload functionality:

1. Ensure Supabase is configured correctly
2. Log in to the app
3. Upload an audio file using the audio upload feature
4. Check the Supabase Storage dashboard to verify the file was uploaded
5. Check the browser console for any errors

## Fallback Behavior

If Supabase Storage is not available:
- The service will create local blob URLs instead
- Audio files will work for the current session only
- Files will not persist across page reloads
- This is useful for development/demo purposes

## Storage Quotas

Default Supabase free tier includes:
- **Storage**: 1 GB
- **File upload size**: 50 MB per file
- **Bandwidth**: 2 GB/month

For production use, consider upgrading to Pro tier for:
- 100 GB storage
- 200 GB bandwidth
- Higher file size limits

## Troubleshooting

### Issue: "Bucket not found"
- Verify the bucket `audio-files` exists in Supabase Storage
- Check bucket name spelling (case-sensitive)

### Issue: "Permission denied"
- Verify RLS policies are set up correctly
- Ensure user is authenticated before uploading
- Check that the user ID matches the folder name

### Issue: "File too large"
- Default limit is 50 MB
- Adjust in Supabase Storage bucket settings
- Consider compressing audio before upload

### Issue: "CORS errors"
- Add your domain to Supabase allowed origins
- Go to Settings → API → CORS Configuration
- Add `http://localhost:5173` for development

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)
