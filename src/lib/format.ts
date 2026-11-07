import type { TFunction } from 'i18next';

/** Short relative time ("5m", "3h", "2d") with a localized date fallback for older items. */
export function formatRelativeTime(t: TFunction, iso: string, language: string): string {
  const date = new Date(iso);
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return t('time.justNow');
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return t('time.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('time.days', { count: days });
  try {
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * OpenRift rules text uses `:rb_might:`-style icon tokens and `_italic_` reminders.
 * We render them as readable plain text until we have proper icon glyphs.
 */
export function formatRulesText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/:rb_([a-z_]+):/g, (_match, token: string) => `[${token.replace(/_/g, ' ')}]`)
    .replace(/_\(([^)]*)\)_/g, '($1)')
    .replace(/\s+/g, ' ')
    .trim();
}
