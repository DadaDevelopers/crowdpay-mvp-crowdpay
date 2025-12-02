-- Create contributions table
CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'bitcoin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view contributions"
ON public.contributions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create contributions"
ON public.contributions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() IS NULL);

-- Create index for performance
CREATE INDEX idx_contributions_campaign_id ON public.contributions(campaign_id);
CREATE INDEX idx_contributions_created_at ON public.contributions(created_at DESC);

-- Enable realtime for contributions table
ALTER TABLE public.contributions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;