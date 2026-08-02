-- Deterministic region derivation, mirrors src/lib/regions.ts
CREATE OR REPLACE FUNCTION public.derive_regions(_title text, _summary text, _ai_summary text, _tickers text[])
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  t text := lower(coalesce(_title,'') || ' ' || coalesce(_ai_summary,'') || ' ' || coalesce(_summary,''));
  out text[] := '{}';
BEGIN
  IF t ~ '(\m(india|indian|nse|bse|sensex|nifty|rbi|sebi|rupee|inr|mumbai|delhi|modi|gst|fii|dii)\M)|dalal street' THEN out := out || ARRAY['India']; END IF;
  IF t ~ '(\m(u\.?s\.?a?|united states|america|american|fed|federal reserve|nasdaq|trump|powell)\M)|dow jones|s&p 500|wall street|treasury yields' THEN out := out || ARRAY['US']; END IF;
  IF t ~ '\m(china|chinese|beijing|shanghai|yuan|renminbi|pboc|hong kong)\M' THEN out := out || ARRAY['China']; END IF;
  IF t ~ '\m(europe|european|eu|ecb|euro zone|eurozone|germany|france|uk|britain|london|euro)\M' THEN out := out || ARRAY['Europe']; END IF;
  IF t ~ '\m(middle east|gulf|opec|saudi|uae|dubai|qatar|iran|israel|red sea)\M' THEN out := out || ARRAY['Middle East']; END IF;
  IF t ~ '\m(global|world|imf|world bank|worldwide|international|geopolit)' THEN out := out || ARRAY['Global']; END IF;
  IF NOT ('India' = ANY(out)) AND _tickers IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(_tickers) s WHERE s ~ '^[A-Z&-]{2,15}$'
  ) THEN out := out || ARRAY['India']; END IF;
  IF array_length(out,1) IS NULL THEN out := ARRAY['Global']; END IF;
  RETURN out;
END;
$$;

-- Auto-tag on insert/update when regions are missing
CREATE OR REPLACE FUNCTION public.news_articles_set_regions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.regions IS NULL OR array_length(NEW.regions,1) IS NULL THEN
    NEW.regions := public.derive_regions(NEW.title, NEW.summary, NEW.ai_summary, NEW.tickers);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_news_articles_set_regions ON public.news_articles;
CREATE TRIGGER trg_news_articles_set_regions
BEFORE INSERT OR UPDATE ON public.news_articles
FOR EACH ROW EXECUTE FUNCTION public.news_articles_set_regions();

-- Backfill existing rows lacking region tags
UPDATE public.news_articles
SET regions = public.derive_regions(title, summary, ai_summary, tickers)
WHERE regions IS NULL OR array_length(regions,1) IS NULL;

-- Indexes for fast region + impact + recency filtering
CREATE INDEX IF NOT EXISTS news_articles_regions_gin ON public.news_articles USING GIN (regions);
CREATE INDEX IF NOT EXISTS news_articles_published_at_idx ON public.news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS news_articles_impact_published_idx ON public.news_articles (impact, published_at DESC);
CREATE INDEX IF NOT EXISTS news_articles_tickers_gin ON public.news_articles USING GIN (tickers);