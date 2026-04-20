import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { apiPost } from '../services/apiClient.js';
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  toTitleCaseLive
} from '../utils/inputSanitizers.js';
import kairaosLogo from '../assets/KOS.png';
import {
  getOnboardingTenantId,
  readOnboardingData,
  saveOnboardingData
} from '../utils/onboardingStorage.js';

const createInitialForm = () => ({
  email: '',
  phone: '',
  password: '',
  business_name: '',
  address: '',
  industry: ''
});

const passwordIsStrong = (value) => {
  if (value.length < 8) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
};

const formatMoney = (value, suffix = '') => `$${Number(value || 0).toFixed(2)}${suffix}`;

const shouldShowLoginLink = (message = '') =>
  message.toLowerCase().includes('already exists') ||
  message.toLowerCase().includes('please log in') ||
  message.toLowerCase().includes('please login');

const getPlanFeatures = (planName = '', index = 0) => {
  const key = planName.toLowerCase();
  if (key.includes('basic') || index === 0) {
    return [
      'Webchat',
      'Instagram & WhatsApp messaging',
      '1-3 clarifying questions to understand customer needs',
      'Recommendation engine',
      'Booking link routing (external link only)'
    ];
  }
  if (key.includes('pro') || index === 1) {
    return [
      'SMS communication channel',
      'Real-time voice conversations',
      'Square booking links and basic booking creation',
      'Operator dashboard (lead visibility and activity log)',
      'Single-step reminder follow-ups',
      'Incomplete or dropped session recovery (up to 3 attempts)'
    ];
  }
  return [
    'Automated check-ins and reminders',
    'Full Square booking lifecycle (create / modify / cancel)',
    'AI Video Avatar (Anam integration)',
    'Customer confirmations and conversation summaries via SMS',
    'Advanced reporting dashboard',
    'Behavior-triggered follow-ups to reduce cancellations and customer churn',
    'Priority support routing'
  ];
};

const Signup = () => {
  const [step, setStep] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [formValues, setFormValues] = useState(createInitialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [billingInterval, setBillingInterval] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const cached = readOnboardingData();
    if (!cached) return;
    setPlans(cached.plans);
    setStep(2);
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(selectedPlanId)),
    [plans, selectedPlanId]
  );

  const setFieldValue = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validateStepOne = () => {
    const nextErrors = {};

    if (!formValues.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formValues.phone || !isValidPhoneNumber(formValues.phone)) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (!passwordIsStrong(formValues.password)) {
      nextErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, and a special character.';
    }
    if (!formValues.business_name) nextErrors.business_name = 'Business name is required.';
    if (!formValues.address) nextErrors.address = 'Address is required.';
    if (!formValues.industry) nextErrors.industry = 'Industry is required.';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOpenConfirm = (event) => {
    event.preventDefault();
    setApiError('');
    if (!validateStepOne()) return;
    setShowConfirm(true);
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        email: sanitizeEmail(formValues.email).trim(),
        phone: sanitizePhone(formValues.phone).trim(),
        business_name: sanitizeText(formValues.business_name).trim(),
        industry: sanitizeText(formValues.industry).trim(),
        address: sanitizeText(formValues.address).trim(),
        password: formValues.password.trim()
      };

      const response = await apiPost('/auth/signup/create_account', payload);

      const safePlans = Array.isArray(response.plans) ? response.plans : [];
      setPlans(safePlans);
      saveOnboardingData(response.tenant_id, safePlans);
      setFormValues((prev) => ({ ...prev, password: '' }));
      setShowConfirm(false);
      setStep(2);
    } catch (error) {
      setApiError(error.message || 'Unable to create account right now. Please try again.');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlanId || !billingInterval) {
      setApiError('Select a plan and billing interval before continuing.');
      return;
    }

    const tenantId = getOnboardingTenantId();
    if (!tenantId) {
      setApiError('Tenant session is missing. Please start signup again.');
      return;
    }

    setApiError('');
    setLoading(true);
    setShowCheckoutConfirm(false);
    setStep(3);

    try {
      const response = await apiPost('/auth/signup/checkout', {
        tenant_id: tenantId,
        plan_id: Number(selectedPlanId),
        interval: billingInterval
      });

      if (!response.checkout_url) {
        throw new Error('Stripe checkout URL was not returned by the server.');
      }

      window.location.href = response.checkout_url;
    } catch (error) {
      setApiError(error.message || 'Unable to start checkout. Please try again.');
      setStep(2);
      setLoading(false);
    }
  };

  const handleOpenCheckoutConfirm = () => {
    if (!selectedPlanId || !billingInterval) {
      setApiError('Select a plan and billing interval before continuing.');
      return;
    }
    setApiError('');
    setShowCheckoutConfirm(true);
  };

  return (
    <div className="kaira-surface relative min-h-screen font-body text-white">
      <header className="absolute inset-x-0 top-0 z-30 bg-transparent px-5 py-6 sm:px-8 lg:px-10">
        <img src={kairaosLogo} alt="KairaOS" className="h-auto w-full max-w-[170px] object-contain opacity-95" />
      </header>

      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

      <section className="relative flex min-h-screen w-full items-center justify-center px-5 pb-8 pt-28 sm:px-8 lg:px-10">
        <div className="w-full max-w-xl space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="font-display text-3xl font-semibold leading-tight">
                Let’s get you started
              </h1>
              <p className="text-sm text-gray-400">
                Step {step} of 3
                {step === 1 ? ' - Business Information' : ''}
                {step === 2 ? ' - Plan Selection' : ''}
                {step === 3 ? ' - Redirecting to Checkout' : ''}
              </p>
            </div>

            {step === 1 ? (
              <form className="space-y-4" onSubmit={handleOpenConfirm}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-white">
                      Email <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="email"
                      value={formValues.email}
                      onChange={(event) => setFieldValue('email', sanitizeEmail(event.target.value))}
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
                      placeholder="you@business.com"
                    />
                    {fieldErrors.email ? <p className="text-xs text-red-400">{fieldErrors.email}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-white">
                      Phone <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="tel"
                      value={formValues.phone}
                      onChange={(event) => setFieldValue('phone', sanitizePhone(event.target.value))}
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
                      placeholder="+1 415 555 2671"
                    />
                    {fieldErrors.phone ? <p className="text-xs text-red-400">{fieldErrors.phone}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-white">
                      Business Name <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      value={formValues.business_name}
                      onChange={(event) =>
                        setFieldValue('business_name', toTitleCaseLive(event.target.value))
                      }
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
                      placeholder="Acme Labs"
                    />
                    {fieldErrors.business_name ? (
                      <p className="text-xs text-red-400">{fieldErrors.business_name}</p>
                    ) : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-white">
                      Industry <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      value={formValues.industry}
                      onChange={(event) => setFieldValue('industry', toTitleCaseLive(event.target.value))}
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
                      placeholder="Wellness"
                    />
                    {fieldErrors.industry ? (
                      <p className="text-xs text-red-400">{fieldErrors.industry}</p>
                    ) : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-white">
                      Address <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="text"
                      value={formValues.address}
                      onChange={(event) => setFieldValue('address', sanitizeText(event.target.value))}
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
                      placeholder="123 Main Street"
                    />
                    {fieldErrors.address ? <p className="text-xs text-red-400">{fieldErrors.address}</p> : null}
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-white">
                      Password <span className="text-red-400">*</span>
                    </span>
                    <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.03] px-3 focus-within:border-white/25">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formValues.password}
                        onChange={(event) =>
                          setFieldValue('password', event.target.value.replace(/[<>]/g, ''))
                        }
                        className="h-full w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
                        placeholder="Min 8 chars, upper/lower/special"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-xs font-medium text-gray-300 transition hover:text-white"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p className="text-xs text-red-400">{fieldErrors.password}</p>
                    ) : null}
                  </label>
                </div>

                {apiError ? (
                  <p className="text-sm text-red-400">
                    {apiError}
                    {shouldShowLoginLink(apiError) ? (
                      <>
                        {' '}
                        <Link to="/login" className="ml-1 font-semibold text-white underline hover:text-gray-200">
                          Log in
                        </Link>
                      </>
                    ) : null}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Processing
                    </span>
                  ) : (
                    'Next'
                  )}
                </button>
              </form>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {plans.map((plan, index) => {
                    const isProPlan = plan.name?.toLowerCase().includes('pro') || index === 1;
                    const isSelected = selectedPlanId === plan.id;
                    return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlanId((prev) => (prev === plan.id ? null : plan.id));
                        setApiError('');
                      }}
                      className={[
                        'rounded-xl border p-0 text-left transition hover:border-emerald-400/70 hover:shadow-[0_0_30px_-18px_rgba(16,185,129,0.95)] hover:ring-1 hover:ring-emerald-400/50',
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/70'
                          : 'bg-white/[0.03]',
                        isProPlan && !isSelected
                          ? 'border-amber-400/80 shadow-[0_0_40px_-20px_rgba(251,191,36,0.9)]'
                          : 'border-white/10'
                      ].join(' ')}
                    >
                      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-4 p-5">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xl font-semibold uppercase tracking-[0.06em]">{plan.name}</h3>
                            {isProPlan ? (
                              <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-300">
                                Popular
                              </span>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <p className="text-4xl font-bold leading-none">{formatMoney(plan.monthly_price)}</p>
                            <p className="text-xs text-white">/month</p>
                          </div>
                        </div>

                        <div className="border-t border-white/10 p-5 md:border-l md:border-t-0">
                          <p className="text-xs uppercase tracking-[0.12em] text-white">Included Features</p>
                          <ul className="mt-3 space-y-2 text-sm text-gray-200">
                            {getPlanFeatures(plan.name, index).map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <span className="mt-[2px] text-amber-300">
                                  ◉
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="border-t border-white/10 px-5 py-4">
                        <div className="space-y-1 text-sm text-white">
                          <p>Setup Fee (One-time): {formatMoney(plan.setup_fee)}</p>
                          <p>Yearly Price: {formatMoney(plan.yearly_price, '/year')}</p>
                          {Number(plan.discount) > 0 ? (
                            <p className="text-emerald-300">Save {Number(plan.discount)}% with this plan</p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">
                    Billing Interval <span className="text-red-400">*</span>
                  </p>
                  <div className="flex gap-3">
                    {['monthly', 'yearly'].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => {
                          setBillingInterval(interval);
                          setApiError('');
                        }}
                        className={[
                          'h-10 rounded-md border px-4 text-sm font-medium capitalize transition',
                          billingInterval === interval
                            ? 'border-white bg-white text-black'
                            : 'border-white/20 bg-white/[0.03] text-gray-200 hover:border-white/40'
                        ].join(' ')}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPlan ? (
                  <p className="text-xs text-gray-400">
                    Selected: <span className="text-white">{selectedPlan.name}</span>
                  </p>
                ) : null}

                {apiError ? <p className="text-sm text-red-400">{apiError}</p> : null}

                <button
                  type="button"
                  onClick={handleOpenCheckoutConfirm}
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Redirecting
                    </span>
                  ) : (
                    'Checkout'
                  )}
                </button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-300">
                <p className="w-full text-center">Redirecting to secure Stripe checkout...</p>
              </div>
            ) : null}
        </div>
      </section>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
            <h2 className="font-display text-xl font-semibold text-white">Confirm Your Details</h2>
            <p className="mt-2 text-sm text-gray-300">
              Please confirm your details are correct before proceeding. Once submitted, your
              account will be created.
            </p>
            <div className="mt-7 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-10 rounded-xl border border-white/20 px-4 text-sm font-medium text-gray-200 transition hover:border-white/40"
                disabled={loading}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCreateAccount}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Continue
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCheckoutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl">
            <h2 className="font-display text-xl font-semibold text-white">Confirm Plan Selection</h2>
            <p className="mt-2 text-sm text-gray-300">
              You have selected{' '}
              <span className="font-semibold text-white">{selectedPlan?.name || 'a plan'}</span> with{' '}
              <span className="font-semibold capitalize text-white">{billingInterval}</span> billing at{' '}
              <span className="font-semibold text-white">
                {formatMoney(
                  billingInterval === 'yearly' ? selectedPlan?.yearly_price : selectedPlan?.monthly_price
                )}
                {billingInterval === 'yearly' ? '/year' : '/month'}
              </span>
              . Setup fee is{' '}
              <span className="font-semibold text-white">{formatMoney(selectedPlan?.setup_fee)}</span> one-time.
            </p>
            <div className="mt-7 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCheckoutConfirm(false)}
                className="h-10 rounded-xl border border-white/20 px-4 text-sm font-medium text-gray-200 transition hover:border-white/40"
                disabled={loading}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Continue
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Signup;
