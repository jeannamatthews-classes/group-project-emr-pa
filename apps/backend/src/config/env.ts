import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: true,
});

export function isEmailVerificationDisabled(): boolean {
  return ['true', '1', 'yes', 'on'].includes(
    (process.env.DISABLE_EMAIL_VERIFICATION ?? '').trim().toLowerCase()
  );
}
