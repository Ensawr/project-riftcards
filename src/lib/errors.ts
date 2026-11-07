import type { TFunction } from 'i18next';

type ErrorLike = { message?: string; code?: string; status?: number; name?: string };

/** Known error codes raised by Supabase Auth or by our own SQL functions. */
const KNOWN_ERRORS: Record<string, string> = {
  invalid_credentials: 'errors.invalidCredentials',
  user_already_exists: 'errors.userExists',
  email_exists: 'errors.userExists',
  email_not_confirmed: 'errors.emailNotConfirmed',
  weak_password: 'errors.weakPassword',
  over_email_send_rate_limit: 'errors.rateLimited',
  over_request_rate_limit: 'errors.rateLimited',
  collection_limit_reached: 'errors.collectionLimit',
  post_rate_limited: 'errors.postRateLimited',
  collection_private: 'errors.collectionPrivate',
  offer_required: 'errors.offerRequired',
  too_many_cards: 'errors.tooManyCards',
  not_allowed: 'errors.notAllowed',
};

export function getErrorMessage(t: TFunction, error: unknown): string {
  const e = (error ?? {}) as ErrorLike;
  const candidates = [e.code, e.message].filter((value): value is string => typeof value === 'string');

  for (const candidate of candidates) {
    for (const [code, key] of Object.entries(KNOWN_ERRORS)) {
      if (candidate === code || candidate.includes(code)) return t(key as never);
    }
  }
  if (e.code === '23505') return t('errors.duplicate');
  if (e.message?.toLowerCase().includes('network') || e.name === 'TypeError') return t('errors.network');
  return t('errors.genericBody');
}
