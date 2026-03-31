-- ====================================================================================
-- Supabase Schema for StudentFolio
-- Run this entire script in your Supabase SQL Editor to set up the database and storage.
-- ====================================================================================

-- 1. Create the 'profiles' table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  university TEXT,
  contact_email TEXT,
  matric_number TEXT,
  phone TEXT,
  faculty TEXT,
  department TEXT,
  resume_url TEXT,
  skills TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add new columns to 'profiles' table if they don't exist (for existing tables)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS matric_number TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS faculty TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Enable Row Level Security (RLS) for 'profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'profiles'
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Allow public read access to all profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );


-- 2. Create the 'projects' table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  link TEXT,
  thumbnail_url TEXT,
  assets JSONB DEFAULT '[]'::JSONB,
  collaborator_emails TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add new columns to 'projects' table if they don't exist (for existing tables)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS collaborator_emails TEXT[] DEFAULT '{}'::TEXT[];

-- Drop unwanted columns from 'projects' table
ALTER TABLE public.projects
DROP COLUMN IF EXISTS file_url;

-- Enable Row Level Security (RLS) for 'projects'
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'projects'
DROP POLICY IF EXISTS "Projects are viewable by everyone." ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects." ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects." ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects." ON public.projects;

-- Allow public read access to all projects
CREATE POLICY "Projects are viewable by everyone."
  ON public.projects FOR SELECT
  USING ( true );

-- Allow users to insert their own projects
CREATE POLICY "Users can insert their own projects."
  ON public.projects FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Allow users to update their own projects
CREATE POLICY "Users can update their own projects."
  ON public.projects FOR UPDATE
  USING ( auth.uid() = user_id );

-- Allow users to delete their own projects
CREATE POLICY "Users can delete their own projects."
  ON public.projects FOR DELETE
  USING ( auth.uid() = user_id );


-- 3. Set up Storage for 'portfolios' bucket
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for 'portfolios' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Allow public read access to all files in the 'portfolios' bucket
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'portfolios' );

-- Allow authenticated users to upload files to the 'portfolios' bucket
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'portfolios' );

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'portfolios' AND auth.uid() = owner );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'portfolios' AND auth.uid() = owner );


-- 4. Create a trigger to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to 'profiles'
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply the trigger to 'projects'
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
