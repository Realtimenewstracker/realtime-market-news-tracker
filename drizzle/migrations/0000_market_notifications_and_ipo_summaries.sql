ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_kind_check;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_kind_check CHECK (kind IN ('price','news','ipo','watchlist','subscription','event'));
CREATE OR REPLACE FUNCTION public.notify_important_news() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.impact >= 3 AND NEW.published_at >= now() - interval '1 day' THEN
 INSERT INTO public.alerts(user_id,kind,subject,title,body,article_id,dedupe_key)
 SELECT p.id,'news','HIGH IMPACT',left(NEW.title,240),left(coalesce(NEW.ai_summary,NEW.summary,''),400),NEW.id,'news:' || NEW.id
 FROM public.profiles p LEFT JOIN public.alert_settings s ON s.user_id=p.id
 WHERE coalesce(s.news_enabled,true)
 ON CONFLICT (user_id,dedupe_key) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER notify_important_news AFTER INSERT ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.notify_important_news();
CREATE OR REPLACE FUNCTION public.notify_account_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; alert_kind text; message text; detail text; event_key text;
BEGIN
 IF TG_TABLE_NAME='watchlist_items' THEN
 owner_id := NEW.user_id; alert_kind := 'watchlist'; message := NEW.value || ' added to watchlist'; detail := 'Price and matching news alerts follow your notification preferences.'; event_key := 'watchlist:' || NEW.id;
 ELSE
 owner_id := NEW.user_id; alert_kind := 'subscription';
 IF TG_OP='INSERT' THEN message := 'Welcome to TrackIndia'; detail := 'Your account has free access until further notice. No payment has been taken.';
 ELSIF NEW.status IS DISTINCT FROM OLD.status THEN message := 'Membership status updated'; detail := 'Status: ' || NEW.status;
 ELSIF NEW.plan IS DISTINCT FROM OLD.plan THEN message := 'Plan preference saved'; detail := 'Selected: ' || NEW.plan || '. This does not activate paid access or charge you.';
 ELSE RETURN NEW; END IF;
 event_key := 'membership:' || NEW.user_id || ':' || NEW.updated_at || ':' || NEW.status || ':' || NEW.plan;
 END IF;
 INSERT INTO public.alerts(user_id,kind,subject,title,body,dedupe_key) VALUES(owner_id,alert_kind,upper(alert_kind),message,detail,event_key) ON CONFLICT(user_id,dedupe_key) DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER notify_watchlist_activity AFTER INSERT ON public.watchlist_items FOR EACH ROW EXECUTE FUNCTION public.notify_account_activity();
CREATE TRIGGER notify_membership_activity AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.notify_account_activity();
REVOKE ALL ON FUNCTION public.notify_important_news() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_account_activity() FROM PUBLIC,anon,authenticated;
CREATE TABLE public.ipo_ai_summaries (source_hash text PRIMARY KEY, summary text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.ipo_ai_summaries TO authenticated;
GRANT ALL ON public.ipo_ai_summaries TO service_role;
ALTER TABLE public.ipo_ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ipo_summary_read ON public.ipo_ai_summaries FOR SELECT TO authenticated USING(true);
CREATE TABLE public.ai_feature_state (feature text PRIMARY KEY, blocked boolean NOT NULL DEFAULT false, message text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.ai_feature_state TO service_role;
ALTER TABLE public.ai_feature_state ENABLE ROW LEVEL SECURITY;