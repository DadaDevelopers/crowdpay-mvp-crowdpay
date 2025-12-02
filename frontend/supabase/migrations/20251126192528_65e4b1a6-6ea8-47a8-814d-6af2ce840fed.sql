-- Add category column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN category text DEFAULT 'other';

-- Add a check constraint for valid categories
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_category_check 
CHECK (category IN ('education', 'medical', 'business', 'community', 'emergency', 'creative', 'sports', 'charity', 'other'));