ALTER TABLE public.ipos
  ADD COLUMN IF NOT EXISTS analyst_score smallint,
  ADD COLUMN IF NOT EXISTS analyst_note text;

UPDATE public.ipos SET analyst_score = LEAST(95, GREATEST(35,
  50
  + COALESCE(LEAST(30, (subscription_x * 3)::int), 0)
  + CASE WHEN gmp IS NOT NULL AND price_max IS NOT NULL AND price_max > 0
      THEN LEAST(20, ((gmp / price_max) * 100)::int) ELSE 0 END
)) WHERE analyst_score IS NULL;

CREATE TABLE IF NOT EXISTS public.ipo_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ipo_id uuid NOT NULL REFERENCES public.ipos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ipo_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ipo_watchlist TO authenticated;
GRANT ALL ON public.ipo_watchlist TO service_role;
ALTER TABLE public.ipo_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ipo watchlist" ON public.ipo_watchlist;
CREATE POLICY "Users manage own ipo watchlist" ON public.ipo_watchlist
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ipo_watchlist_user ON public.ipo_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_ipos_status_open ON public.ipos(status, open_date DESC);