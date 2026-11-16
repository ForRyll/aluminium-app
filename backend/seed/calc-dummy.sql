-- Data DUMMY kalkulator (acuan Purwokerto). Semua belum_diverifikasi.
-- Aman dijalankan ulang, tapi akan MENGHAPUS isi tabel calc_* lalu mengisi ulang.
TRUNCATE calc_profile_prices, calc_profile_types, calc_glass_types, calc_accessories,
  calc_products, calc_recipe_components, calc_accessory_rules, calc_finishings,
  calc_overheads, calc_settings;

INSERT INTO calc_settings (id, key, value) VALUES
 (gen_random_uuid(), 'bar_length_m', 6),
 (gen_random_uuid(), 'waste_standard_pct', 10),
 (gen_random_uuid(), 'waste_complex_pct', 15),
 (gen_random_uuid(), 'markup_standard_pct', 25),
 (gen_random_uuid(), 'markup_min_pct', 15),
 (gen_random_uuid(), 'markup_premium_pct', 35),
 (gen_random_uuid(), 'glass_min_m2', 0.25);

INSERT INTO calc_profile_prices (id, brand, series, "pricePerMeter") VALUES
 (gen_random_uuid(), 'Inkalum', '3', 95000),  (gen_random_uuid(), 'Inkalum', '4', 110000),
 (gen_random_uuid(), 'Dacon', '3', 95000),    (gen_random_uuid(), 'Dacon', '4', 110000),
 (gen_random_uuid(), 'Alexindo', '3', 115000),(gen_random_uuid(), 'Alexindo', '4', 130000),
 (gen_random_uuid(), 'YKK AP', '3', 180000),  (gen_random_uuid(), 'YKK AP', '4', 200000),
 (gen_random_uuid(), 'Forta', '3', 100000),   (gen_random_uuid(), 'Forta', '4', 115000),
 (gen_random_uuid(), 'Persik', '3', 95000),   (gen_random_uuid(), 'Persik', '4', 110000);

INSERT INTO calc_profile_types (id, code, name, series, "priceOverride") VALUES
 (gen_random_uuid(), 'KUSEN_M_3', 'Kusen M 3 inci', '3', NULL),
 (gen_random_uuid(), 'DAUN_Z_3', 'Profil daun / Z 3 inci', '3', NULL),
 (gen_random_uuid(), 'KUSEN_SLIDING_3', 'Kusen sliding 3 inci', '3', NULL),
 (gen_random_uuid(), 'DAUN_SLIDING_3', 'Profil daun sliding 3 inci', '3', NULL),
 (gen_random_uuid(), 'LIST_KACA_3', 'List kaca 3 inci', '3', NULL),
 (gen_random_uuid(), 'DOOR_JAMB_4', 'Door jamb 4 inci', '4', NULL),
 (gen_random_uuid(), 'PROFIL_PINTU_4', 'Profil pintu 4 inci', '4', NULL);

INSERT INTO calc_glass_types (id, name, "thicknessMm", "pricePerM2") VALUES
 (gen_random_uuid(), 'Bening / clear', 3, 137000),
 (gen_random_uuid(), 'Bening / clear', 5, 170000),
 (gen_random_uuid(), 'Bening / clear', 6, 237000),
 (gen_random_uuid(), 'Riben / dark grey', 5, 205000),
 (gen_random_uuid(), 'Riben / dark grey', 6, 300000),
 (gen_random_uuid(), 'Es / mistlite', 5, 343000),
 (gen_random_uuid(), 'Tempered bening', 5, 285000),
 (gen_random_uuid(), 'Tempered bening', 8, 425000);

INSERT INTO calc_accessories (id, code, name, unit, price) VALUES
 (gen_random_uuid(), 'ENGSEL_KUPU', 'Engsel kupu-kupu', 'buah', 35000),
 (gen_random_uuid(), 'FRICTION_STAY', 'Friction stay / casement', 'set', 105000),
 (gen_random_uuid(), 'HANDLE_SWING', 'Handle jendela swing', 'buah', 25000),
 (gen_random_uuid(), 'GRENDEL', 'Grendel jendela', 'buah', 45000),
 (gen_random_uuid(), 'RODA_SLIDING', 'Roda sliding', 'buah', 25000),
 (gen_random_uuid(), 'KUNCI_SLIDING', 'Kunci sliding', 'set', 35000),
 (gen_random_uuid(), 'HANDLE_PINTU', 'Handle pintu', 'set', 65000),
 (gen_random_uuid(), 'ENGSEL_PINTU', 'Engsel pintu', 'buah', 45000),
 (gen_random_uuid(), 'KUNCI_PINTU', 'Kunci pintu', 'set', 85000),
 (gen_random_uuid(), 'KARET_KACA', 'Karet kaca', 'm', 8000),
 (gen_random_uuid(), 'SEALANT', 'Sealant silikon', 'tube', 45000),
 (gen_random_uuid(), 'SEKRUP', 'Sekrup aluminium', 'buah', 500),
 (gen_random_uuid(), 'RIVET', 'Rivet aluminium', 'buah', 300);

INSERT INTO calc_products (id, code, name, priority, "buildLabor", "installLabor", "minPrice", "glassWidthFormula", "glassHeightFormula") VALUES
 (gen_random_uuid(), 'JENDELA_SWING', 'Jendela swing', 1, 175000, 125000, 500000, '(L / S) - 25', 'T - 8'),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'Jendela sliding', 2, 175000, 125000, 500000, '(L / S) - 10', 'T - 20'),
 (gen_random_uuid(), 'PINTU_SWING', 'Pintu swing', 3, 300000, 175000, 750000, '(L / S) - 25', 'T - 25'),
 (gen_random_uuid(), 'KACA_MATI', 'Kaca mati / fixed', 4, 100000, 100000, 0, 'L - 6', 'T - 6');

INSERT INTO calc_recipe_components (id, "productCode", name, "profileTypeCode", "lengthFormula", "qtyFormula", "sortOrder") VALUES
 (gen_random_uuid(), 'JENDELA_SWING', 'Kusen atas', 'KUSEN_M_3', 'L', '1', 1),
 (gen_random_uuid(), 'JENDELA_SWING', 'Kusen bawah', 'KUSEN_M_3', 'L', '1', 2),
 (gen_random_uuid(), 'JENDELA_SWING', 'Kusen samping', 'KUSEN_M_3', 'T', '2', 3),
 (gen_random_uuid(), 'JENDELA_SWING', 'Daun atas', 'DAUN_Z_3', '(L / S) - 8', 'S', 4),
 (gen_random_uuid(), 'JENDELA_SWING', 'Daun bawah', 'DAUN_Z_3', '(L / S) - 8', 'S', 5),
 (gen_random_uuid(), 'JENDELA_SWING', 'Daun samping', 'DAUN_Z_3', 'T - 8', '2 * S', 6),

 (gen_random_uuid(), 'JENDELA_SLIDING', 'Kusen atas', 'KUSEN_SLIDING_3', 'L', '1', 1),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'Kusen bawah', 'KUSEN_SLIDING_3', 'L', '1', 2),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'Kusen samping', 'KUSEN_SLIDING_3', 'T', '2', 3),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'Daun horizontal', 'DAUN_SLIDING_3', '(L / S) - 3', '2 * S', 4),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'Daun vertikal', 'DAUN_SLIDING_3', 'T - 8', '2 * S', 5),

 (gen_random_uuid(), 'PINTU_SWING', 'Kusen atas', 'DOOR_JAMB_4', 'L', '1', 1),
 (gen_random_uuid(), 'PINTU_SWING', 'Kusen samping', 'DOOR_JAMB_4', 'T', '2', 2),
 (gen_random_uuid(), 'PINTU_SWING', 'Daun atas', 'PROFIL_PINTU_4', '(L / S) - 8', 'S', 3),
 (gen_random_uuid(), 'PINTU_SWING', 'Daun bawah', 'PROFIL_PINTU_4', '(L / S) - 8', 'S', 4),
 (gen_random_uuid(), 'PINTU_SWING', 'Daun samping', 'PROFIL_PINTU_4', 'T - 8', '2 * S', 5),

 (gen_random_uuid(), 'KACA_MATI', 'Kusen atas', 'KUSEN_M_3', 'L', '1', 1),
 (gen_random_uuid(), 'KACA_MATI', 'Kusen bawah', 'KUSEN_M_3', 'L', '1', 2),
 (gen_random_uuid(), 'KACA_MATI', 'Kusen samping', 'KUSEN_M_3', 'T', '2', 3),
 (gen_random_uuid(), 'KACA_MATI', 'List kaca horizontal', 'LIST_KACA_3', 'L - 6', '2', 4),
 (gen_random_uuid(), 'KACA_MATI', 'List kaca vertikal', 'LIST_KACA_3', 'T - 6', '2', 5);

-- GW dan GH = lebar dan tinggi kaca (cm), dihitung dari rumus kaca produk
INSERT INTO calc_accessory_rules (id, "productCode", "accessoryCode", "qtyFormula", optional) VALUES
 (gen_random_uuid(), 'JENDELA_SWING', 'FRICTION_STAY', '2 * S', false),
 (gen_random_uuid(), 'JENDELA_SWING', 'HANDLE_SWING', 'S', false),
 (gen_random_uuid(), 'JENDELA_SWING', 'GRENDEL', 'S', true),
 (gen_random_uuid(), 'JENDELA_SWING', 'ENGSEL_KUPU', '2 * S', true),
 (gen_random_uuid(), 'JENDELA_SWING', 'KARET_KACA', '2 * (GW + GH) / 100 * S', false),
 (gen_random_uuid(), 'JENDELA_SWING', 'SEALANT', '1', false),
 (gen_random_uuid(), 'JENDELA_SWING', 'SEKRUP', '14', false),
 (gen_random_uuid(), 'JENDELA_SWING', 'RIVET', '10', false),

 (gen_random_uuid(), 'JENDELA_SLIDING', 'RODA_SLIDING', '2 * S', false),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'KUNCI_SLIDING', '1', false),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'KARET_KACA', '2 * (GW + GH) / 100 * S', false),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'SEALANT', '1', false),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'SEKRUP', '14', false),
 (gen_random_uuid(), 'JENDELA_SLIDING', 'RIVET', '10', false),

 (gen_random_uuid(), 'PINTU_SWING', 'ENGSEL_PINTU', '3 * S', false),
 (gen_random_uuid(), 'PINTU_SWING', 'HANDLE_PINTU', 'S', false),
 (gen_random_uuid(), 'PINTU_SWING', 'KUNCI_PINTU', '1', false),
 (gen_random_uuid(), 'PINTU_SWING', 'KARET_KACA', '2 * (GW + GH) / 100 * S', false),
 (gen_random_uuid(), 'PINTU_SWING', 'SEALANT', '1', false),
 (gen_random_uuid(), 'PINTU_SWING', 'SEKRUP', '14', false),
 (gen_random_uuid(), 'PINTU_SWING', 'RIVET', '10', false),

 (gen_random_uuid(), 'KACA_MATI', 'KARET_KACA', '2 * (GW + GH) / 100', false),
 (gen_random_uuid(), 'KACA_MATI', 'SEALANT', '1', false),
 (gen_random_uuid(), 'KACA_MATI', 'SEKRUP', '14', false),
 (gen_random_uuid(), 'KACA_MATI', 'RIVET', '10', false);

INSERT INTO calc_finishings (id, name, percent) VALUES
 (gen_random_uuid(), 'Silver / natural', 0),
 (gen_random_uuid(), 'Hitam', 5),
 (gen_random_uuid(), 'Cokelat', 5),
 (gen_random_uuid(), 'Putih', 10),
 (gen_random_uuid(), 'Motif kayu', 25);

INSERT INTO calc_overheads (id, name, kind, amount, enabled) VALUES
 (gen_random_uuid(), 'Ongkir material lokal', 'flat', 50000, true),
 (gen_random_uuid(), 'Transportasi pemasangan', 'flat', 75000, true),
 (gen_random_uuid(), 'Mata gerinda', 'per_unit', 5000, true),
 (gen_random_uuid(), 'Bahan habis pakai', 'per_unit', 15000, true),
 (gen_random_uuid(), 'Listrik dan alat', 'per_unit', 10000, true),
 (gen_random_uuid(), 'Biaya tak terduga (% dari modal produksi)', 'percent', 5, false);