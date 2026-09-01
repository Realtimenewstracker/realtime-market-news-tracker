
CREATE TABLE public.ipos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text,
  board text not null default 'mainboard',
  status text not null default 'upcoming',
  price_min numeric,
  price_max numeric,
  lot_size int,
  issue_size text,
  open_date date,
  close_date date,
  listing_date date,
  gmp numeric,
  subscription_x numeric,
  listing_gain_pct numeric,
  detail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.ipos TO anon;
GRANT SELECT ON public.ipos TO authenticated;
GRANT ALL ON public.ipos TO service_role;
ALTER TABLE public.ipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "IPOs are public to read" ON public.ipos FOR SELECT USING (true);
CREATE INDEX idx_ipos_status_open ON public.ipos (status, open_date DESC);

INSERT INTO public.ipos (name, symbol, board, status, price_min, price_max, lot_size, issue_size, open_date, close_date, listing_date, gmp, subscription_x, listing_gain_pct) VALUES
('Vikram Solar', 'VIKRAMSOLR', 'mainboard', 'open', 315, 332, 45, '₹2,079 Cr', CURRENT_DATE - 1, CURRENT_DATE + 1, CURRENT_DATE + 4, 42, 3.8, NULL),
('Patel Retail', 'PATELRETL', 'mainboard', 'open', 237, 255, 58, '₹242 Cr', CURRENT_DATE, CURRENT_DATE + 2, CURRENT_DATE + 5, 30, 1.4, NULL),
('Shreeji Global FMCG', NULL, 'sme', 'open', 120, 125, 1000, '₹42 Cr', CURRENT_DATE, CURRENT_DATE + 2, CURRENT_DATE + 5, 15, 2.1, NULL),
('Anlon Healthcare', NULL, 'mainboard', 'upcoming', 86, 91, 164, '₹121 Cr', CURRENT_DATE + 3, CURRENT_DATE + 5, CURRENT_DATE + 8, 12, NULL, NULL),
('Sattva Engineering', NULL, 'sme', 'upcoming', 90, 95, 1200, '₹34 Cr', CURRENT_DATE + 4, CURRENT_DATE + 6, CURRENT_DATE + 9, 8, NULL, NULL),
('Regaal Resources', 'REGAAL', 'mainboard', 'listed', 96, 102, 147, '₹306 Cr', CURRENT_DATE - 12, CURRENT_DATE - 10, CURRENT_DATE - 7, NULL, 156.8, 22.4),
('Highway Infrastructure', NULL, 'mainboard', 'listed', 65, 70, 211, '₹130 Cr', CURRENT_DATE - 18, CURRENT_DATE - 16, CURRENT_DATE - 13, NULL, 300.2, 41.2),
('JD Cables', NULL, 'sme', 'listed', 145, 150, 1000, '₹68 Cr', CURRENT_DATE - 20, CURRENT_DATE - 18, CURRENT_DATE - 15, NULL, 88.5, -3.6),
('Bluestone Jewellery', 'BLUESTONE', 'mainboard', 'closed', 492, 517, 29, '₹1,540 Cr', CURRENT_DATE - 6, CURRENT_DATE - 4, CURRENT_DATE + 1, 5, 2.7, NULL),
('All Time Plastics', NULL, 'mainboard', 'closed', 260, 275, 54, '₹401 Cr', CURRENT_DATE - 7, CURRENT_DATE - 5, CURRENT_DATE + 1, 18, 5.1, NULL);
