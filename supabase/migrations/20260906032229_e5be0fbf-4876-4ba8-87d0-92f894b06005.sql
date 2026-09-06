DELETE FROM public.ipo_watchlist;
DELETE FROM public.ipos;

INSERT INTO public.ipos (name, symbol, board, status, price_min, price_max, lot_size, issue_size, open_date, close_date, listing_date, gmp, subscription_x, listing_gain_pct, analyst_score, analyst_note, detail_url) VALUES
('Pranav Constructions', NULL, 'mainboard', 'upcoming', 118, 124, 120, '₹351.03 Cr', DATE '2026-09-07', DATE '2026-09-09', DATE '2026-09-14', 14, NULL, NULL, 62, 'Mumbai redevelopment-focused realty developer; order book led growth.', 'https://www.nseindia.com/market-data/issue-information'),
('Kanohar Electricals', NULL, 'mainboard', 'upcoming', 601, 632, 23, '₹1,055.74 Cr', DATE '2026-09-08', DATE '2026-09-10', DATE '2026-09-16', 58, NULL, NULL, 74, 'Largest issue of the week; transformers and electrical equipment capex cycle play.', 'https://www.nseindia.com/market-data/issue-information'),
('Glass Wall Systems', NULL, 'mainboard', 'upcoming', 172, 182, 82, '₹427.89 Cr', DATE '2026-09-08', DATE '2026-09-10', DATE '2026-09-16', 18, NULL, NULL, 60, 'Facade engineering; tied to commercial real estate build-out.', 'https://www.nseindia.com/market-data/issue-information'),
('Prasol Chemicals', NULL, 'mainboard', 'upcoming', 643, 676, 22, '₹500 Cr', DATE '2026-09-08', DATE '2026-09-10', DATE '2026-09-16', 47, NULL, NULL, 68, 'Specialty chemicals maker with import-substitution portfolio.', 'https://www.nseindia.com/market-data/issue-information'),
('Karamtara Engineering', NULL, 'mainboard', 'upcoming', 241, 254, 59, '₹875 Cr', DATE '2026-09-09', DATE '2026-09-11', DATE '2026-09-17', 33, NULL, NULL, 70, 'Transmission towers and solar mounting structures; grid capex beneficiary.', 'https://www.nseindia.com/market-data/issue-information'),
('LCC Projects', NULL, 'mainboard', 'upcoming', 139, 146, 102, '₹427.14 Cr', DATE '2026-09-09', DATE '2026-09-11', DATE '2026-09-17', 12, NULL, NULL, 57, 'Gujarat-based EPC contractor across water, roads and buildings.', 'https://www.nseindia.com/market-data/issue-information'),
('Steamhouse India', NULL, 'mainboard', 'upcoming', NULL, NULL, NULL, '₹414 Cr', DATE '2026-09-09', DATE '2026-09-11', DATE '2026-09-17', NULL, NULL, NULL, 55, 'Industrial energy / steam-as-a-service; price band yet to be announced.', 'https://www.nseindia.com/market-data/issue-information'),
('Asset Reconstruction Company (India)', NULL, 'mainboard', 'upcoming', 132, 139, 107, '₹732.97 Cr', DATE '2026-09-09', DATE '2026-09-11', DATE '2026-09-17', 16, NULL, NULL, 63, 'India''s oldest ARC; stressed-asset resolution franchise.', 'https://www.nseindia.com/market-data/issue-information'),
('Manipal Payment & Identity Solutions', NULL, 'mainboard', 'upcoming', 322, 339, 44, '₹805 Cr', DATE '2026-09-09', DATE '2026-09-11', DATE '2026-09-17', 41, NULL, NULL, 71, 'Cards, payments and identity manufacturing with bank clients.', 'https://www.nseindia.com/market-data/issue-information'),
('Rentomojo', NULL, 'mainboard', 'upcoming', 384, 404, 37, '₹1,255.57 Cr', DATE '2026-09-09', DATE '2026-09-11', DATE '2026-09-17', 62, NULL, NULL, 76, 'Consumer furniture and appliance rentals; largest consumer issue of the week.', 'https://www.nseindia.com/market-data/issue-information'),
('Veegaland Developers', NULL, 'mainboard', 'upcoming', 130, 140, 107, '₹210 Cr', DATE '2026-09-10', DATE '2026-09-15', DATE '2026-09-18', 9, NULL, NULL, 54, 'Kerala-focused residential developer.', 'https://www.nseindia.com/market-data/issue-information');

DELETE FROM public.policy_beneficiaries;
DELETE FROM public.policies;

INSERT INTO public.policies (title, authority, category, status, summary, detail, source_url, announced_at, effective_from, outlay_cr, impact, sentiment, heat_score, sectors) VALUES
('Semicon 2.0 notified with ₹1.275 lakh crore outlay', 'MeitY / India Semiconductor Mission', 'Manufacturing', 'implemented',
 'Six-pillar semiconductor programme notified; 40% capex support for silicon fabs, plus design, equipment, materials, ATMP and R&D.',
 'Approved by Cabinet in July 2026 and notified on 31 August 2026 with a ₹1,27,500 crore outlay across 10 categories. 300mm fabs need 40,000 wafer starts/month and ₹20,000 crore minimum investment; compound semiconductor, photonics and sensor fabs get 35% support.',
 'https://www.ism.gov.in/', TIMESTAMPTZ '2026-08-31 14:00+05:30', DATE '2026-09-01', 127500, 3, 'positive', 92, ARRAY['Semiconductors','Electronics','Capital Goods']),
('Mobile Phone Manufacturing Scheme (MPMS) notified', 'MeitY', 'Manufacturing', 'implemented',
 '₹62,500 crore scheme to deepen the mobile supply chain, lift domestic value addition and back Indian-owned handset brands.',
 'Notified 21 August 2026. Targets around 60,000 direct jobs and cumulative production of about ₹39 lakh crore, with incentives tied to domestic value addition, design and IP ownership.',
 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2302098', TIMESTAMPTZ '2026-08-21 19:14+05:30', DATE '2026-09-01', 62500, 3, 'positive', 88, ARRAY['Electronics','EMS','Consumer Tech']),
('GOBARdhan National Circular Bioenergy Scheme approved', 'Union Cabinet / MoPNG', 'Energy', 'announced',
 '₹23,731 crore compressed biogas scheme with assured offtake at ₹2,110/MMBTU and up to ₹2 crore per TPD capital assistance.',
 'Approved 6 August 2026 for FY2026-27 to FY2035-36. Aims to raise domestic CBG output nearly ten-fold with pipeline connectivity, stable pricing and credit support.',
 'https://www.pmindia.gov.in/en/news_updates/cabinet-approves-gobardhan-indias-national-unified-scheme-for-compressed-biogas-with-an-outlay-of-rs-23731-crore/', TIMESTAMPTZ '2026-08-06 15:30+05:30', DATE '2026-04-01', 23731, 3, 'positive', 82, ARRAY['Oil & Gas','Renewables','Agri']),
('National Investment Policy for Urea (NIPU-2026)', 'Union Cabinet / Dept. of Fertilizers', 'Agriculture', 'announced',
 'New urea investment policy to add domestic capacity and cut import dependence in fertilisers.',
 'Cleared alongside Semicon 2.0 and the Mobile Phone Manufacturing Scheme in July 2026 to attract brownfield and greenfield urea investment with assured returns on new capacity.',
 'https://pib.gov.in/', TIMESTAMPTZ '2026-07-16 12:00+05:30', NULL, NULL, 2, 'positive', 70, ARRAY['Fertilisers','Chemicals','Agri']),
('Four railway multitracking projects cleared', 'CCEA / Ministry of Railways', 'Infrastructure', 'announced',
 'Cabinet approved four railway multitracking projects in August 2026 to decongest freight corridors.',
 'Part of ₹45,741.93 crore of August 2026 Cabinet approvals covering compressed biogas, highways and railway capacity. Execution depends on tendering timelines.',
 'https://pib.gov.in/', TIMESTAMPTZ '2026-08-27 16:00+05:30', NULL, NULL, 2, 'positive', 68, ARRAY['Railways','Infrastructure','Cement']),
('Two national highway corridors approved', 'CCEA / MoRTH', 'Infrastructure', 'announced',
 'Two new highway corridors cleared in August 2026, adding to the road capex pipeline.',
 'Approved as part of the August 2026 Cabinet decisions on infrastructure. Order inflow visibility for road EPC players and materials suppliers.',
 'https://pib.gov.in/', TIMESTAMPTZ '2026-08-20 16:00+05:30', NULL, NULL, 2, 'positive', 64, ARRAY['Roads','Infrastructure','Cement']),
('RBI holds repo rate at 5.25%', 'Reserve Bank of India', 'Monetary Policy', 'implemented',
 'The Monetary Policy Committee kept the repo rate unchanged at 5.25% at its August 2026 meeting.',
 'MPC met 3-5 August 2026; standing deposit facility, marginal standing facility and bank rate were also left unchanged. Liquidity conditions eased, supporting credit growth.',
 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=63403', TIMESTAMPTZ '2026-08-05 10:00+05:30', DATE '2026-08-05', NULL, 3, 'neutral', 78, ARRAY['Banks','NBFC','Real Estate']),
('Parliament passes MMDR Act amendments', 'Parliament of India / Ministry of Mines', 'Mining', 'implemented',
 'Amendments empower the Centre to regulate mineral-bearing lands and restrict state-level levies.',
 'Passed in the Monsoon Session that concluded 13 August 2026. Reduces levy uncertainty for miners and improves critical-mineral block auctions.',
 'https://prsindia.org/policy/monthly-policy-review/august-2026', TIMESTAMPTZ '2026-08-12 18:00+05:30', NULL, NULL, 2, 'positive', 66, ARRAY['Metals','Mining','Steel']);

INSERT INTO public.policy_beneficiaries (policy_id, company, symbol, sector, rationale, benefit_score)
SELECT p.id, x.company, x.symbol, x.sector, x.rationale, x.score FROM public.policies p
JOIN (VALUES
 ('Semicon 2.0 notified with ₹1.275 lakh crore outlay','CG Power & Industrial Solutions','CGPOWER','Semiconductors','OSAT joint venture in Sanand under the mission',88),
 ('Semicon 2.0 notified with ₹1.275 lakh crore outlay','Kaynes Technology','KAYNES','Semiconductors','Approved OSAT unit and electronics manufacturing scale',86),
 ('Semicon 2.0 notified with ₹1.275 lakh crore outlay','Tata Elxsi','TATAELXSI','Design','Chip design and embedded services demand',72),
 ('Semicon 2.0 notified with ₹1.275 lakh crore outlay','ASM Technologies','ASMS','Equipment','Semiconductor engineering and equipment services',68),
 ('Mobile Phone Manufacturing Scheme (MPMS) notified','Dixon Technologies','DIXON','EMS','Largest domestic handset contract manufacturer',92),
 ('Mobile Phone Manufacturing Scheme (MPMS) notified','Amber Enterprises','AMBER','EMS','Electronics division expanding into mobile components',76),
 ('Mobile Phone Manufacturing Scheme (MPMS) notified','Syrma SGS Technology','SYRMA','EMS','PCB assembly and component localisation',74),
 ('Mobile Phone Manufacturing Scheme (MPMS) notified','Cyient DLM','CYIENTDLM','EMS','Design-led manufacturing capacity',66),
 ('GOBARdhan National Circular Bioenergy Scheme approved','Indian Oil Corporation','IOC','Oil & Gas','Largest CBG offtake and retail network',82),
 ('GOBARdhan National Circular Bioenergy Scheme approved','GAIL (India)','GAIL','Gas','CBG pipeline injection and blending',80),
 ('GOBARdhan National Circular Bioenergy Scheme approved','Gujarat Gas','GUJGASLTD','City Gas','CBG blending in the city gas network',74),
 ('GOBARdhan National Circular Bioenergy Scheme approved','Praj Industries','PRAJIND','Bioenergy','Technology provider for CBG plants',86),
 ('National Investment Policy for Urea (NIPU-2026)','Chambal Fertilisers','CHAMBLFERT','Fertilisers','Existing urea capacity and brownfield expansion',80),
 ('National Investment Policy for Urea (NIPU-2026)','Coromandel International','COROMANDEL','Fertilisers','Nutrient portfolio and capex ability',72),
 ('National Investment Policy for Urea (NIPU-2026)','Rashtriya Chemicals & Fertilizers','RCF','Fertilisers','PSU urea producer with expansion plans',76),
 ('Four railway multitracking projects cleared','Rail Vikas Nigam','RVNL','Railways','Execution arm for multitracking works',84),
 ('Four railway multitracking projects cleared','IRCON International','IRCON','Railways','Track and civil order inflow',78),
 ('Four railway multitracking projects cleared','Texmaco Rail & Engineering','TEXRAIL','Railways','Wagon and track products demand',70),
 ('Two national highway corridors approved','KNR Constructions','KNRCON','Roads','Highway EPC order pipeline',76),
 ('Two national highway corridors approved','PNC Infratech','PNCINFRA','Roads','Road corridor execution track record',74),
 ('Two national highway corridors approved','UltraTech Cement','ULTRACEMCO','Cement','Volume pull from road and rail capex',66),
 ('RBI holds repo rate at 5.25%','HDFC Bank','HDFCBANK','Banks','Stable rates support margins and credit growth',72),
 ('RBI holds repo rate at 5.25%','Bajaj Finance','BAJFINANCE','NBFC','Easier liquidity aids borrowing costs',74),
 ('RBI holds repo rate at 5.25%','DLF','DLF','Real Estate','Steady home-loan rates support demand',68),
 ('Parliament passes MMDR Act amendments','NMDC','NMDC','Mining','Levy clarity on mineral-bearing land',78),
 ('Parliament passes MMDR Act amendments','Hindustan Zinc','HINDZINC','Metals','Predictable state levy regime',72),
 ('Parliament passes MMDR Act amendments','Tata Steel','TATASTEEL','Steel','Captive mining cost visibility',70)
) AS x(policy_title, company, symbol, sector, rationale, score)
ON x.policy_title = p.title;