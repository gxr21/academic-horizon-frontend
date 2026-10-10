// Instant feedback before anything is sent. The server repeats (and extends) these checks.

const TYPO_DOMAINS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
};

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', 'grr.la',
  '10minutemail.com', '10minutemail.net', '20minutemail.com', 'tempmail.com', 'temp-mail.org',
  'temp-mail.io', 'tempmail.net', 'tempmailo.com', 'throwawaymail.com', 'trashmail.com',
  'yopmail.com', 'yopmail.net', 'yopmail.fr', 'getnada.com', 'nada.email', 'dispostable.com',
  'fakeinbox.com', 'fakemail.net', 'maildrop.cc', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'moakt.com', 'emailondeck.com', 'burnermail.io', 'discard.email',
  'spambox.us', 'mail.tm', 'emailfake.com', 'dropmail.me', 'mailcatch.com', 'minuteinbox.com',
]);

const EMAIL_PATTERN = /^[a-z0-9._%+'-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/;

/**
 * Returns an Arabic message when the address is clearly wrong, otherwise ''.
 * Pass { strict: false } on the login page: it only checks the shape of the address.
 */
export function checkEmail(raw, { strict = true } = {}) {
  const email = String(raw || '').trim().toLowerCase();
  if (!email) return 'أدخل بريدك الإلكتروني.';

  const match = email.match(EMAIL_PATTERN);
  if (!match) return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (!strict) return '';

  const domain = match[1];
  if (TYPO_DOMAINS[domain]) {
    return `هل تقصد ${email.split('@')[0]}@${TYPO_DOMAINS[domain]}؟ تأكد من كتابة البريد بشكل صحيح.`;
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return 'لا نقبل البريد المؤقت. استخدم بريدك الحقيقي (Gmail أو Outlook أو بريد الجامعة).';
  }
  return '';
}
