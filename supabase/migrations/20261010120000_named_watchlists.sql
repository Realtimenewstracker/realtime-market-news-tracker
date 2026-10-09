CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlists TO authenticated;
GRANT ALL ON public.watchlists TO service_role;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlists_own" ON public.watchlists FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.watchlists (user_id, name)
SELECT DISTINCT user_id, 'Default' FROM public.watchlist_items
ON CONFLICT (user_id, name) DO NOTHING;

ALTER TABLE public.watchlist_items ADD COLUMN watchlist_id UUID;
UPDATE public.watchlist_items AS item
SET watchlist_id = watchlist.id
FROM public.watchlists AS watchlist
WHERE watchlist.user_id = item.user_id AND watchlist.name = 'Default';

ALTER TABLE public.watchlist_items
  ALTER COLUMN watchlist_id SET NOT NULL,
  ADD CONSTRAINT watchlist_items_watchlist_id_fkey
    FOREIGN KEY (watchlist_id) REFERENCES public.watchlists(id) ON DELETE CASCADE;

ALTER TABLE public.watchlist_items
  DROP CONSTRAINT watchlist_items_user_id_kind_value_key;
ALTER TABLE public.watchlist_items
  ADD CONSTRAINT watchlist_items_group_kind_value_key
    UNIQUE (user_id, watchlist_id, kind, value);
CREATE INDEX watchlist_items_watchlist_idx ON public.watchlist_items (watchlist_id, created_at DESC);

DROP POLICY "watchlist_own" ON public.watchlist_items;
CREATE POLICY "watchlist_own" ON public.watchlist_items FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );
