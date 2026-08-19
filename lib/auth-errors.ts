export function friendlyAuthError(message?: string) {
  const text = (message || '').toLowerCase()
  if (text.includes('rate limit')) {
    return 'Too many confirmation emails were sent in a short time. Wait about an hour, then try once. Do not keep clicking Create account.'
  }
  if (text.includes('already registered') || text.includes('already exists')) {
    return 'An account with this email already exists. Sign in, or reset your password.'
  }
  if (text.includes('invalid login')) {
    return 'That email or password is not correct.'
  }
  return message || 'Something went wrong. Try again.'
}
