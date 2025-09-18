-- StaffSync Seed Data (MySQL 8)
-- Seeds musterings, bases, units, members, users, and Tier3 scoping.
-- Apply after running schema.mysql.sql

USE staffsync;
START TRANSACTION;

-- ─── Musterings ─────────────────────────────────────────────────────────────
INSERT INTO musterings(code, name) VALUES
  ('P',   'Pilot or Navigator'),
  ('C2',  'Command & Control'),
  ('SS',  'Support Services'),
  ('INT', 'Intelligence'),
  ('PROT','Protection Services'),
  ('ENG', 'Engineering'),
  ('TECH','Technical'),
  ('FIN', 'Finance'),
  ('COM', 'Communications'),
  ('HR',  'Human Resources'),
  ('ENV', 'Environmental');

-- ─── Bases ─────────────────────────────────────────────────────────────────
INSERT INTO bases(base_id, name) VALUES
  (1, 'AFB Waterkloof'),
  (2, 'AFB Ysterplaat'),
  (3, 'AFB Makhado');

-- ─── Units (IDs chosen to match mockData references) ────────────────────────
INSERT INTO units(unit_id, base_id, name) VALUES
  (1,  1, '1 Squadron'),
  (2,  1, 'Command Centre'),
  (3,  2, 'Support Services'),
  (4,  2, 'Intelligence Wing'),
  (5,  3, 'Protection Services'),
  (8,  3, 'Technical Maintenance'),
  (9,  2, 'Engineering'),
  (13, 1, 'Finance'),
  (14, 1, 'Corporate Communications'),
  (15, 1, 'Human Resources'),
  (16, 2, 'Environmental');

-- ─── Members (sample subset aligned with your mock file) ────────────────────
INSERT INTO members(
  member_id, force_number, suffix, rank, first_name, middle_names, surname,
  id_number, mustering_code, unit_id, cell_number, work_tel, email,
  security_clearance, post_description, service_type, is_deployable,
  is_area_bound, current_whereabouts, is_registered_for_studies, readiness_status,
  created_at, updated_at
) VALUES
  (1, '90119292MI', 'Mr', 'Capt', 'John',  'William', 'Doe',     '8001015009087', 'P',   1, '+27821234567','0123456001','john.doe@saaf.mil',
     'Secret','Pilot or Navigator','Permanent Force', 1, 0, 'Base HQ', 1, 'Ready',  NOW(3), NOW(3)),
  (2, '01020344MC', 'Ms', 'Maj',  'Anna',  'Marie',   'Smith',   '8505054005086', 'C2',  2, '+27827654321','0123456002','anna.smith@saaf.mil',
     'Top Secret','Mission Control','Permanent Force', 1, 0, 'Command Center', 0, 'Ready', NOW(3), NOW(3)),
  (3, '01020033MI', 'Mr', 'Cpl',  'Esia',  'Rod',     'Mokoena', '8801015009087', 'P',   1, '+27834234567','0123456001','esia.mokoena@saaf.mil',
     'Secret','Pilot or Navigator','Permanent Force', 1, 0, 'Base HQ', 1, 'Ready', NOW(3), NOW(3)),
  (4, '98045679M',  'Mr', 'Capt', 'Eric',  'Goft',    'Tola',    '8001015009087', 'P',   1, NULL,NULL,'eric.tola@saaf.mil',
     'Secret','Pilot or Navigator','Permanent Force', 1, 0, 'Base HQ', 0, 'Pending', NOW(3), NOW(3)),
  (5, '92034567P',  'Mr', 'Lt',   'Thabo', NULL,      'Maseko',  '9001015009087', 'C2',  2, NULL,NULL,'thabo.maseko@saaf.mil',
     'Secret','ATC','Permanent Force', 1, 0, NULL, 0, 'Ready', NOW(3), NOW(3)),
  (6, '93011223Q',  'Ms', 'Sgt',  'Lerato',NULL,      'Nkosi',   '9305054005086', 'SS',  3, NULL,NULL,'lerato.nkosi@saaf.mil',
     'Secret','Catering','Permanent Force', 1, 0, NULL, 0, 'Ready', NOW(3), NOW(3)),
  (7, '91099876R',  'Mr', 'Capt', 'Sipho', NULL,      'Dlamini', '8801015009087', 'INT', 4, NULL,NULL,'sipho.dlamini@saaf.mil',
     'Secret','Electronic Warfare','Permanent Force', 1, 0, NULL, 0, 'Ready', NOW(3), NOW(3)),
  (8, '90077665S',  'Ms', 'Cpl',  'Naledi',NULL,      'Molefe',  '9502026009087', 'PROT',5, NULL,NULL,'naledi.molefe@saaf.mil',
     'Secret','Access Control','Permanent Force', 0, 0, NULL, 0, 'Pending', NOW(3), NOW(3));

-- ─── Users (map iter_level to tier) ─────────────────────────────────────────
-- Mapping: 1→TIER1, 2→TIER2, 3→TIER3, 4→TIER4, else USER
INSERT INTO users(user_id, username, email, password_hash, tier, is_active, force_number, mustering_code, last_login) VALUES
  (1, 'jdoe',     'john.doe@saaf.mil',  'hashed_password_123', 'TIER3', 1, '90119292MI', 'P',   '2025-06-08 14:30:00.000'),
  (2, 'asmith',   'anna.smith@saaf.mil','hashed_password_456', 'TIER2', 1, '01020344MC', 'C2',  '2025-06-09 09:15:00.000'),
  (3, 'emokoena', 'esia.mokoena@saaf.mil','hashed_password_345','TIER3', 1, '01020033MI', 'P',   '2025-06-08 14:30:00.000'),
  (4, 'etola',    'eric.tola@saaf.mil', 'hashed_password_158', 'TIER3', 1, '98045679M',  'P',   '2025-06-08 14:30:00.000');

-- ─── Tier3 scoping (which musterings a Tier3 can manage) ────────────────────
INSERT INTO user_mustering_access(user_id, mustering_code) VALUES
  (1, 'P'),
  (3, 'P'),
  (4, 'P');

COMMIT;

