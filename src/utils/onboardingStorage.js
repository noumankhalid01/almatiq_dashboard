const ONBOARDING_TENANT_KEY = 'onboarding_tenant_id';
const ONBOARDING_SIGNUP_CACHE_KEY = 'onboarding_signup_cache';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const saveOnboardingData = (tenantId, plans) => {
  const safePlans = Array.isArray(plans) ? plans : [];
  sessionStorage.setItem(ONBOARDING_TENANT_KEY, String(tenantId));
  sessionStorage.setItem(
    ONBOARDING_SIGNUP_CACHE_KEY,
    JSON.stringify({
      tenant_id: tenantId,
      plans: safePlans,
      expires_at: Date.now() + THIRTY_DAYS_MS
    })
  );
};

export const readOnboardingData = () => {
  const raw = sessionStorage.getItem(ONBOARDING_SIGNUP_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const isExpired = !parsed?.expires_at || Date.now() > parsed.expires_at;
    if (isExpired) {
      sessionStorage.removeItem(ONBOARDING_SIGNUP_CACHE_KEY);
      sessionStorage.removeItem(ONBOARDING_TENANT_KEY);
      return null;
    }

    if (!parsed?.tenant_id || !Array.isArray(parsed?.plans)) return null;
    return parsed;
  } catch {
    sessionStorage.removeItem(ONBOARDING_SIGNUP_CACHE_KEY);
    return null;
  }
};

export const getOnboardingTenantId = () => Number(sessionStorage.getItem(ONBOARDING_TENANT_KEY));

