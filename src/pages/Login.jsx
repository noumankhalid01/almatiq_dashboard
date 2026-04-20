import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../services/apiClient.js';
import { sanitizeEmail, sanitizeText } from '../utils/inputSanitizers.js';
import { saveOnboardingData } from '../utils/onboardingStorage.js';
import kairaosLogo from '../assets/KOS.png';

const createInitialForm = () => ({
  email: '',
  password: ''
});

const Login = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(createInitialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setFieldValue = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const email = sanitizeEmail(formValues.email).trim();
    const password = formValues.password;

    setLoading(true);
    setApiError('');

    try {
      const loginResponse = await apiPost('/auth/login', { email, password });
      localStorage.clear();
      localStorage.setItem('auth', JSON.stringify(loginResponse));
      navigate('/', { replace: true });
    } catch (error) {
      const onboardingIncomplete =
        error.status === 403 &&
        typeof error.payload?.detail === 'string' &&
        error.payload.detail.toLowerCase() === 'onboarding incomplete';

      if (onboardingIncomplete) {
        try {
          const continueResponse = await apiPost('/auth/signup/continue', { email, password });
          saveOnboardingData(continueResponse.tenant_id, continueResponse.plans);
          navigate('/signup', { replace: true });
          return;
        } catch (continueError) {
          setApiError(continueError.message || 'Unable to continue onboarding right now.');
          return;
        } finally {
          setLoading(false);
        }
      }

      setApiError(error.message || 'Unable to login right now. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(false);
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
            <h1 className="font-display text-3xl font-semibold leading-tight">Welcome back</h1>
            <p className="text-sm text-gray-400">
              Login to manage bookings, leads, and your business operations.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3">
              <label className="space-y-2">
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
                  Password <span className="text-red-400">*</span>
                </span>
                <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.03] px-3 focus-within:border-white/25">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formValues.password}
                    onChange={(event) =>
                      setFieldValue('password', sanitizeText(event.target.value).replace(/\s+$/, ''))
                    }
                    className="h-full w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
                    placeholder="Enter your password"
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

            {apiError ? <p className="text-sm text-red-400">{apiError}</p> : null}

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Logging in
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="ml-1 text-sm font-medium text-white transition hover:text-emerald-300">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
