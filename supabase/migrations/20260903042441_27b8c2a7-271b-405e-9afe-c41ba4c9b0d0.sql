
-- profiles.username
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));

-- Government policy tracker
CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authority text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'announced',
  summary text,
  detail text,
  source_url text,
  announced_at timestamptz NOT NULL DEFAULT now(),
  effective_from date,
  outlay_cr numeric,
  impact int NOT NULL DEFAULT 2,
  sentiment text NOT NULL DEFAULT 'neutral',
  heat_score int NOT NULL DEFAULT 50,
  sectors text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.policy_beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  company text NOT NULL,
  symbol text,
  sector text,
  rationale text,
  benefit_score int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS policy_beneficiaries_policy_idx ON public.policy_beneficiaries(policy_id);
CREATE INDEX IF NOT EXISTS policies_announced_idx ON public.policies(announced_at DESC);

GRANT SELECT ON public.policies TO anon, authenticated;
GRANT ALL ON public.policies TO service_role;
GRANT SELECT ON public.policy_beneficiaries TO anon, authenticated;
GRANT ALL ON public.policy_beneficiaries TO service_role;

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_beneficiaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Policies are public" ON public.policies;
CREATE POLICY "Policies are public" ON public.policies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Policy beneficiaries are public" ON public.policy_beneficiaries;
CREATE POLICY "Policy beneficiaries are public" ON public.policy_beneficiaries FOR SELECT USING (true);

-- Seed
INSERT INTO public.policies (title, authority, category, status, summary, detail, source_url, announced_at, effective_from, outlay_cr, impact, sentiment, heat_score, sectors) VALUES
('National Semiconductor Mission 2.0 approved with fresh fab incentives', 'Union Cabinet / MeitY', 'PLI & Incentives', 'implemented', 'Cabinet clears a second tranche of fiscal support for fabs, ATMP units and display plants, with 50% capex support for approved projects.', 'The scheme extends capital support to compound semiconductor, ATMP and OSAT units and adds a design-linked incentive top-up. Domestic electronics manufacturers and their EMS partners are the immediate beneficiaries.', 'https://www.meity.gov.in/', now() - interval '3 days', current_date, 76000, 3, 'bullish', 88, ARRAY['Semiconductors','Electronics Manufacturing']),
('Customs duty cut on critical minerals and battery inputs', 'Ministry of Finance', 'Taxation', 'implemented', 'Basic customs duty removed on lithium, cobalt and rare earth inputs used in EV cells and electronics.', 'Lower input costs for cell manufacturers and EV OEMs, mildly negative for domestic mineral processors competing with imports.', 'https://www.indiabudget.gov.in/', now() - interval '9 days', current_date, NULL, 3, 'bullish', 81, ARRAY['EV','Batteries','Auto']),
('RBI keeps repo rate unchanged, eases risk weights on NBFC lending', 'Reserve Bank of India', 'Monetary Policy', 'implemented', 'MPC holds the repo rate and rolls back higher risk weights on bank lending to NBFCs, freeing up capital.', 'Lower risk weights release growth capital for lenders and reduce the cost of funds for NBFCs and housing finance companies.', 'https://www.rbi.org.in/', now() - interval '5 days', current_date, NULL, 3, 'bullish', 84, ARRAY['Banks','NBFC','Housing Finance']),
('PM Gati Shakti: Rs 2.6 lakh crore highway and rail corridor pipeline', 'Ministry of Road Transport / Railways', 'Infrastructure', 'announced', 'Fresh multi-modal corridor awards planned across FY, with EPC and HAM packages hitting the market this quarter.', 'Order-book visibility improves for road EPC players, cement and steel demand in the corridor states rises.', 'https://morth.nic.in/', now() - interval '12 days', current_date + 30, 260000, 3, 'bullish', 79, ARRAY['Infrastructure','Cement','Capital Goods']),
('Defence indigenisation: fourth positive list bans import of 100 systems', 'Ministry of Defence', 'Defence & Strategic', 'implemented', 'Import embargo on a further 100 sub-systems with staggered timelines pushes orders to domestic defence PSUs and private primes.', 'Defence PSUs and private tier-1 suppliers gain a captive order pipeline over the next three years.', 'https://www.mod.gov.in/', now() - interval '18 days', current_date, NULL, 2, 'bullish', 72, ARRAY['Defence','Aerospace']),
('New solar ALMM List-II enforcement for domestic cells', 'Ministry of New & Renewable Energy', 'Energy & Climate', 'announced', 'Approved List of Models and Manufacturers for solar cells becomes mandatory for government-backed projects.', 'Domestic integrated cell-and-module makers gain pricing power; developers reliant on imported cells face margin pressure.', 'https://mnre.gov.in/', now() - interval '22 days', current_date + 60, NULL, 2, 'bullish', 68, ARRAY['Solar','Renewables']),
('GST rate rationalisation panel proposes merger of 12% and 18% slabs', 'GST Council', 'Taxation', 'proposed', 'A ministerial panel recommends collapsing two slabs, which would reset pricing across consumer categories.', 'Consumer staples and durables see demand shifts depending on final slab placement; still at the proposal stage.', 'https://gstcouncil.gov.in/', now() - interval '27 days', NULL, NULL, 2, 'neutral', 58, ARRAY['FMCG','Consumer Durables','Retail']),
('SEBI eases disclosure norms and speeds up IPO approvals', 'SEBI', 'Capital Markets', 'implemented', 'Shorter listing timelines and relaxed disclosure requirements for large issuers.', 'Broking houses, exchanges, RTAs and merchant bankers benefit from higher primary-market throughput.', 'https://www.sebi.gov.in/', now() - interval '31 days', current_date, NULL, 2, 'bullish', 61, ARRAY['Capital Markets','Broking']);

INSERT INTO public.policy_beneficiaries (policy_id, company, symbol, sector, rationale, benefit_score)
SELECT p.id, x.company, x.symbol, x.sector, x.rationale, x.score FROM public.policies p
JOIN (VALUES
 ('National Semiconductor Mission 2.0 approved with fresh fab incentives','CG Power & Industrial Solutions','CGPOWER','Electronics','OSAT joint venture directly approved under the scheme',92),
 ('National Semiconductor Mission 2.0 approved with fresh fab incentives','Kaynes Technology','KAYNES','Electronics','ATMP unit qualifies for 50% capex support',89),
 ('National Semiconductor Mission 2.0 approved with fresh fab incentives','Dixon Technologies','DIXON','EMS','Downstream demand from localised chip supply',74),
 ('National Semiconductor Mission 2.0 approved with fresh fab incentives','Tata Elxsi','TATAELXSI','Design','Design-linked incentive top-up for chip design services',66),
 ('Customs duty cut on critical minerals and battery inputs','Exide Industries','EXIDEIND','Batteries','Lower landed cost of lithium cell inputs',84),
 ('Customs duty cut on critical minerals and battery inputs','Amara Raja Energy','ARE&M','Batteries','Gigafactory input costs fall materially',82),
 ('Customs duty cut on critical minerals and battery inputs','Tata Motors','TATAMOTORS','Auto','EV cost curve improves for the market leader',71),
 ('RBI keeps repo rate unchanged, eases risk weights on NBFC lending','Bajaj Finance','BAJFINANCE','NBFC','Cheaper bank funding lines after risk-weight rollback',88),
 ('RBI keeps repo rate unchanged, eases risk weights on NBFC lending','Shriram Finance','SHRIRAMFIN','NBFC','High bank-borrowing mix gains the most',85),
 ('RBI keeps repo rate unchanged, eases risk weights on NBFC lending','HDFC Bank','HDFCBANK','Banks','Capital released on NBFC exposure',73),
 ('PM Gati Shakti: Rs 2.6 lakh crore highway and rail corridor pipeline','Larsen & Toubro','LT','Infrastructure','Largest bidder for corridor EPC packages',90),
 ('PM Gati Shakti: Rs 2.6 lakh crore highway and rail corridor pipeline','KNR Constructions','KNRCON','Roads','Pure-play road EPC order inflow',80),
 ('PM Gati Shakti: Rs 2.6 lakh crore highway and rail corridor pipeline','UltraTech Cement','ULTRACEMCO','Cement','Corridor cement demand in core states',72),
 ('Defence indigenisation: fourth positive list bans import of 100 systems','Hindustan Aeronautics','HAL','Defence','Direct beneficiary of import embargo list',89),
 ('Defence indigenisation: fourth positive list bans import of 100 systems','Bharat Electronics','BEL','Defence','Electronics sub-systems on the positive list',87),
 ('Defence indigenisation: fourth positive list bans import of 100 systems','Bharat Dynamics','BDL','Defence','Missile sub-systems localisation',78),
 ('New solar ALMM List-II enforcement for domestic cells','Waaree Energies','WAAREEENER','Solar','Integrated domestic cell capacity ready',86),
 ('New solar ALMM List-II enforcement for domestic cells','Premier Energies','PREMIERENE','Solar','Domestic cell lines already ALMM listed',84),
 ('New solar ALMM List-II enforcement for domestic cells','Tata Power','TATAPOWER','Renewables','Captive cell and module plant in Tamil Nadu',70),
 ('GST rate rationalisation panel proposes merger of 12% and 18% slabs','Hindustan Unilever','HINDUNILVR','FMCG','Slab merger resets pricing on mass categories',62),
 ('GST rate rationalisation panel proposes merger of 12% and 18% slabs','Voltas','VOLTAS','Consumer Durables','Durables could move to a lower effective rate',60),
 ('SEBI eases disclosure norms and speeds up IPO approvals','Angel One','ANGELONE','Broking','Higher primary-market activity and new demat accounts',80),
 ('SEBI eases disclosure norms and speeds up IPO approvals','BSE Ltd','BSE','Exchanges','Listing fee and transaction volume upside',78),
 ('SEBI eases disclosure norms and speeds up IPO approvals','KFin Technologies','KFINTECH','RTA','Registrar volumes rise with IPO throughput',75)
) AS x(ptitle, company, symbol, sector, rationale, score) ON x.ptitle = p.title;
