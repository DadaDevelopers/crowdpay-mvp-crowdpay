-- Update campaigns table to allow null user_id for anonymous campaigns
ALTER TABLE public.campaigns ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies for campaigns to allow anyone to create
DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.campaigns;

CREATE POLICY "Anyone can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (true);

-- Update contributions policy to allow anyone to contribute
DROP POLICY IF EXISTS "Authenticated users can create contributions" ON public.contributions;

CREATE POLICY "Anyone can create contributions"
ON public.contributions
FOR INSERT
WITH CHECK (true);