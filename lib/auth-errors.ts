export function friendlyAuthError(message?: string) {
  const text = (message || '').toLowerCase()
  if (text.includes('rate limit')) {
    return 'Too many emails were sent in a short time. Wait about an hour, then try once.'
  }
  if (text.includes('already registered') || text.includes('already exists') || text.includes('user already')) {
    return 'An account with this email already exists. Sign in, or use Forgot password.'
  }
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'That email or password is not correct.'
  }
  if (text.includes('confirm') || text.includes('not confirmed') || text.includes('verif')) {
    return 'Confirm your email first. Open the Confirm email address link we sent, then sign in.'
  }
  if (text.includes('same password') || text.includes('should be different')) {
    return 'Choose a new password that is different from your current one.'
  }
  if (text.includes('weak') || text.includes('password')) {
    return message || 'That password is not strong enough.'
  }
  return message || 'Something went wrong. Try again.'
}
