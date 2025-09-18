-- StaffSync MySQL GRANTs
-- Creates an admin and a limited app user. Run after schema + seed.

USE staffsync;

-- Create users (adjust passwords before using in any environment)
CREATE USER IF NOT EXISTS 'staffsync_admin'@'%' IDENTIFIED BY 'change_me_admin';
CREATE USER IF NOT EXISTS 'staffsync_app'@'%'   IDENTIFIED BY 'change_me_app';

-- Admin: full control over the database
GRANT ALL PRIVILEGES ON staffsync.* TO 'staffsync_admin'@'%';

-- App user: minimal direct table access, uses stored procedures for business ops
-- Reference data read
GRANT SELECT ON staffsync.musterings TO 'staffsync_app'@'%';
GRANT SELECT ON staffsync.units      TO 'staffsync_app'@'%';
GRANT SELECT ON staffsync.bases      TO 'staffsync_app'@'%';

-- Allow executing tier-enforced procedures
GRANT EXECUTE ON PROCEDURE staffsync.sp_members_select_all     TO 'staffsync_app'@'%';
GRANT EXECUTE ON PROCEDURE staffsync.sp_member_update          TO 'staffsync_app'@'%';
GRANT EXECUTE ON PROCEDURE staffsync.sp_member_insert          TO 'staffsync_app'@'%';
GRANT EXECUTE ON PROCEDURE staffsync.sp_member_delete          TO 'staffsync_app'@'%';
GRANT EXECUTE ON PROCEDURE staffsync.sp_reset_user_password    TO 'staffsync_app'@'%';

-- Important: do NOT grant direct SELECT/UPDATE/DELETE on sensitive tables
-- (members, users, password_reset_audit), as that would bypass tier rules.

FLUSH PRIVILEGES;

-- Usage: After your API authenticates a request, set session-scoped claims:
--   SET @jwt_user_id = 1;                             -- int
--   SET @jwt_tier = 'TIER3';                          -- Tier string
--   SET @jwt_force_number = '90119292MI';             -- User's force number (optional)
--   SET @jwt_musterings = JSON_ARRAY('P','C2');       -- Tier3 scopes
-- Then call procedures, e.g.: CALL sp_members_select_all();

