-- Add analytics tracking table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  referrer TEXT,
  user_agent TEXT
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert views
CREATE POLICY "Anyone can record profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view their own analytics
CREATE POLICY "Users can view their own analytics"
ON public.profile_views
FOR SELECT
USING (profile_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

-- Update tags table to include tag_type for likes/dislikes
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS tag_type TEXT DEFAULT 'like' CHECK (tag_type IN ('like', 'dislike'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_type ON public.tags(tag_type);