-- Create profiles table for user information and Bitcoin wallet setup
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bitcoin_wallet_type TEXT CHECK (bitcoin_wallet_type IN ('lightning', 'onchain', 'internal')),
  lightning_address TEXT,
  onchain_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add campaign customization fields
ALTER TABLE public.campaigns
ADD COLUMN cover_image_url TEXT,
ADD COLUMN slug TEXT UNIQUE,
ADD COLUMN theme_color TEXT DEFAULT '#F7931A',
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create index on slug for faster lookups
CREATE INDEX idx_campaigns_slug ON public.campaigns(slug);

-- Update campaigns foreign key to reference profiles
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS campaigns_user_id_fkey;

ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;