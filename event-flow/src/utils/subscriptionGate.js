const gateKeywords = [
  'subscription',
  'feature',
  'feature_limit',
  'limit',
  'quota',
  'plan',
  'premium',
  'upgrade',
  'payment',
  'billing',
  'invoice',
  'ai_credit',
  'ai credits',
  'credits',
  'gói',
  'goi',
  'đăng ký',
  'dang ky',
  'hạn mức',
  'han muc',
  'tính năng',
  'tinh nang',
  'thanh toán',
  'thanh toan',
  'active subscription',
  'no active subscription',
  'subscription_not_found',
  'limit exceeded',
  'events limit exceeded',
]

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

export function isSubscriptionGateError(error) {
  const status = error?.response?.status
  const data = error?.response?.data || {}
  const sourceText = normalizeText([
    data.errorCode,
    data.message,
    data.path,
    error?.message,
  ].filter(Boolean).join(' '))

  if (!sourceText) return false

  const hasGateKeyword = gateKeywords.some((keyword) => sourceText.includes(keyword))

  return (
    ((status === 400 || status === 403 || status === 404) && hasGateKeyword) ||
    sourceText.includes('subscription_required') ||
    sourceText.includes('feature_limit_exceeded') ||
    sourceText.includes('subscription_not_found')
  )
}

export function getSubscriptionGateInfo(error, organizationId = null) {
  if (!isSubscriptionGateError(error)) return null

  const data = error?.response?.data || {}

  return {
    message: data.message || 'Tính năng này cần gói đăng ký phù hợp hoặc đã chạm hạn mức sử dụng.',
    errorCode: data.errorCode || null,
    subscriptionPath: organizationId ? `/organizations/${organizationId}/subscription` : null,
  }
}
