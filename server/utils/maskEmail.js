/**
 * Masks user email for privacy in administrative/public listings
 * Example: john.doe@example.com -> jo***@example.com
 * Example: me@test.com -> m***@test.com
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return trimmed.includes('@') ? trimmed : '';
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (!domain || !domain.includes('.')) {
    return '';
  }

  const visibleChars = local.length > 2 ? 2 : 1;
  const maskedLocal = local.slice(0, visibleChars) + '***';

  return `${maskedLocal}@${domain}`;
};

module.exports = {
  maskEmail,
};
