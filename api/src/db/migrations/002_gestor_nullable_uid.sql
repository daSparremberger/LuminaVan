-- Allow NULL firebase_uid for gestores (pre-registration by email)
ALTER TABLE gestores ALTER COLUMN firebase_uid DROP NOT NULL;
