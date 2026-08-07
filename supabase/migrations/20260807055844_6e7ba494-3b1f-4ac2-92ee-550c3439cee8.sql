
CREATE OR REPLACE FUNCTION public.derive_sentiment(txt text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN (txt ~* '(surge|jump|rally|soar|gain|climb|rise|rose|record high|all-time high|beats? estimates|upgrade|outperform|inflow|buyback|bullish|boost|approval|approved|wins|order win|strong demand|recover)')
      AND NOT (txt ~* '(fall|fell|drop|slump|plunge|crash|tumble|slide|decline|loss|downgrade|outflow|bearish|layoff|job cuts|probe|fraud|scam|default|banned|penalt|fine[sd]?|sell-?off|weak demand|warns|warning|recession|slowdown|attack|war|sanction|tariff)')
      THEN 'bullish'
    WHEN (txt ~* '(fall|fell|drop|slump|plunge|crash|tumble|slide|decline|loss|downgrade|outflow|bearish|layoff|job cuts|probe|fraud|scam|default|banned|penalt|sell-?off|weak demand|warns|warning|recession|slowdown|attack|war|sanction|tariff)')
      THEN 'bearish'
    ELSE 'neutral'
  END
$$;

CREATE OR REPLACE FUNCTION public.derive_impact(txt text)
RETURNS smallint LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN txt ~* '(rbi|reserve bank|federal reserve|fomc|repo rate|interest rate|rate (cut|hike|decision)|inflation|cpi|wpi|gdp|budget|monetary policy|crude|opec|tariff|war|invasion|sanction|default|crash|record high|all-time high|sebi|ipo|merger|acquisition|earnings|guidance|downgrade|upgrade|election)'
      THEN 3::smallint
    WHEN txt ~* '(nifty|sensex|bank nifty|dollar|rupee|bond yield|fii|dii|oil price|gold|bitcoin|stake|contract|dividend|bonus issue|stock split|q[1-4] (results|profit)|billion|crore|trillion)'
      THEN 2::smallint
    ELSE 1::smallint
  END
$$;

UPDATE public.news_articles
SET sentiment = public.derive_sentiment(coalesce(title,'') || ' ' || coalesce(ai_summary, summary, '')),
    impact = public.derive_impact(coalesce(title,'') || ' ' || coalesce(ai_summary, summary, ''))
WHERE ai_summary IS NULL;

CREATE OR REPLACE FUNCTION public.set_news_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE txt text;
BEGIN
  txt := coalesce(NEW.title,'') || ' ' || coalesce(NEW.ai_summary, NEW.summary, '');
  IF NEW.ai_summary IS NULL THEN
    IF NEW.sentiment IS NULL OR NEW.sentiment = 'neutral' THEN
      NEW.sentiment := public.derive_sentiment(txt);
    END IF;
    IF NEW.impact IS NULL OR NEW.impact <= 1 THEN
      NEW.impact := public.derive_impact(txt);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_news_articles_defaults ON public.news_articles;
CREATE TRIGGER trg_news_articles_defaults
BEFORE INSERT ON public.news_articles
FOR EACH ROW EXECUTE FUNCTION public.set_news_defaults();
