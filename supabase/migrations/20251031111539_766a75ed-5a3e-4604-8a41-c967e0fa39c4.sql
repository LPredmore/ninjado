-- Enable pgcrypto extension for crypt() function support
-- Required for verify_parental_pin function to work
CREATE EXTENSION IF NOT EXISTS pgcrypto;