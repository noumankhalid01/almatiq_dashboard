import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import instagramLogo from '../assets/instagram_logo.png';
import squareLogo from '../assets/square_logo.png';
import twilioLogo from '../assets/twilio_logo.png';
import { apiGet, apiPatch, apiPost } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toBooleanFlag } from '../utils/tokenUtils.js';

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white text-white shadow-sm">
      {icon}
    </span>
    <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
  </div>
);

const StatusChip = ({ connected }) => (
  <span
    className={[
      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
      connected
        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
        : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
    ].join(' ')}
  >
    {connected ? 'Connected' : 'Not Connected'}
  </span>
);

const BulletItem = ({ children }) => (
  <li className="flex items-start gap-2 text-sm text-gray-300">
    <svg
      className="mt-1 h-4 w-4 shrink-0 text-emerald-300"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="M7.5 13.5 4.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 10.5 3 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m7.5 13.5 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
    <span className="leading-6">{children}</span>
  </li>
);

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101010] p-6 text-center shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:overflow-y-auto sm:p-8">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-300">{message}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/[0.08]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmDisabled ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const TwilioCredentialsModal = ({
  open,
  values,
  errors,
  loading,
  tokenVisible,
  onChange,
  onToggleTokenVisible,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:overflow-y-auto sm:p-8">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-white">Connect Twilio</h3>
        </div>

        <div className="mt-8 space-y-4">
          <label className="block space-y-2 text-left">
            <span className="text-sm font-medium text-white">
              Twilio SID <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={values.twilioSid}
              onChange={(event) => onChange('twilioSid', event.target.value)}
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
              placeholder="Enter Twilio SID"
            />
            {errors.twilioSid ? <p className="text-sm text-red-400">{errors.twilioSid}</p> : null}
          </label>

          <label className="block space-y-2 text-left">
            <span className="text-sm font-medium text-white">
              Twilio Auth Token <span className="text-red-400">*</span>
            </span>
            <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.03] px-3 focus-within:border-white/25">
              <input
                type={tokenVisible ? 'text' : 'password'}
                value={values.twilioAuthToken}
                onChange={(event) => onChange('twilioAuthToken', event.target.value)}
                className="h-full w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
                placeholder="Enter Twilio Auth Token"
              />
              <button
                type="button"
                onClick={onToggleTokenVisible}
                className="text-xs font-medium text-gray-300 transition hover:text-white"
              >
                {tokenVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.twilioAuthToken ? <p className="text-sm text-red-400">{errors.twilioAuthToken}</p> : null}
          </label>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SecretField = ({ label, value, placeholder, visible, onToggleVisible }) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</span>
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        readOnly
        value={value}
        className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] px-3 pr-14 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none read-only:cursor-not-allowed"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-xs font-medium text-gray-300 transition hover:text-white"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  </label>
);

const twilioCredentialsCache = new Map();
const twilioCredentialsRequested = new Map();
const instagramConfigRequested = new Map();
const Integrations = () => {
  const location = useLocation();
  const { auth, login } = useAuth();
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');
  const currentPlanId = Number(auth?.current_plan?.plan_id || 0);
  const showSquareSection = currentPlanId !== 1;
  const instagramLoginUrl = import.meta.env.VITE_INSTAGRAM_LOGIN_URL || '';
  const squareLoginUrl = import.meta.env.VITE_SQUARE_LOGIN_URL || '';
  const instagramState = String(auth?.id || auth?.tenant_id || '');
  const handledInstagramCodeRef = useRef('');
  const handledSquareCodeRef = useRef('');
  const hasLoadedTwilioCredsRef = useRef(false);
  const [flashMessage, setFlashMessage] = useState({ message: '', type: 'error' });
  const [isExchangingInstagramCode, setIsExchangingInstagramCode] = useState(false);
  const [isExchangingSquareCode, setIsExchangingSquareCode] = useState(false);
  const [showDisconnectInstagramModal, setShowDisconnectInstagramModal] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);
  const [showDisconnectTwilioModal, setShowDisconnectTwilioModal] = useState(false);
  const [isDisconnectingTwilio, setIsDisconnectingTwilio] = useState(false);
  const [showDisconnectSquareModal, setShowDisconnectSquareModal] = useState(false);
  const [isDisconnectingSquare, setIsDisconnectingSquare] = useState(false);
  const [showTwilioModal, setShowTwilioModal] = useState(false);
  const [isSavingTwilio, setIsSavingTwilio] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showTwilioModalToken, setShowTwilioModalToken] = useState(false);
  const [twilioCredentials, setTwilioCredentials] = useState({ sid: '', token: '' });
  const [twilioForm, setTwilioForm] = useState({
    twilioSid: auth?.twilio_sid || '',
    twilioAuthToken: auth?.twilio_auth_token || ''
  });
  const [twilioFormErrors, setTwilioFormErrors] = useState({
    twilioSid: '',
    twilioAuthToken: ''
  });
  const twilioConnected = toBooleanFlag(auth.twilio_status);
  const instagramConnected = toBooleanFlag(auth.instagram_status);
  const squareConnected = toBooleanFlag(auth.square_status);

  const handleConnectSquare = () => {
    setFlashMessage({ message: '', type: 'error' });

    if (!squareLoginUrl) {
      setFlashMessage({
        type: 'error',
        message: 'Square login URL is not configured.'
      });
      return;
    }

    const csrfState = crypto.randomUUID();
    sessionStorage.setItem('csrf_state_code', csrfState);

    const finalUrl = new URL(squareLoginUrl, window.location.origin);
    finalUrl.searchParams.set('state', csrfState);
    window.location.href = finalUrl.toString();
  };

  const handleConfirmDisconnectSquare = async () => {
    setIsDisconnectingSquare(true);
    setFlashMessage({ message: '', type: 'error' });

    try {
      const response = await apiPatch('/integrations/square/disconnect', null, { auth: true });
      const currentAuth = auth || {};
      const nextAuth = {
        ...currentAuth,
        ...(response && typeof response === 'object' ? response : {}),
        square_status: false
      };

      login(nextAuth);
      setFlashMessage({
        type: 'success',
        message: 'Square disconnected successfully.'
      });
      setShowDisconnectSquareModal(false);
    } catch (error) {
      setFlashMessage({
        type: 'error',
        message: error.message || 'Unable to disconnect Square right now.'
      });
      setShowDisconnectSquareModal(false);
    } finally {
      setIsDisconnectingSquare(false);
    }
  };

  useEffect(() => {
    if (!twilioConnected) {
      hasLoadedTwilioCredsRef.current = false;
      twilioCredentialsRequested.delete(authKey);
      twilioCredentialsCache.delete(authKey);
      setTwilioCredentials({ sid: '', token: '' });
      setTwilioForm({ twilioSid: '', twilioAuthToken: '' });
      setShowTwilioToken(false);
      setShowTwilioModalToken(false);
      return;
    }

    const cachedTwilio = twilioCredentialsCache.get(authKey);
    if (cachedTwilio) {
      setTwilioCredentials(cachedTwilio);
      setTwilioForm({
        twilioSid: cachedTwilio.sid || '',
        twilioAuthToken: cachedTwilio.token || ''
      });
    }
  }, [authKey, twilioConnected]);

  useEffect(() => {
    if (!twilioConnected) return;

    const cachedTwilio = twilioCredentialsCache.get(authKey);
    if (cachedTwilio) {
      setTwilioCredentials(cachedTwilio);
      setTwilioForm({
        twilioSid: cachedTwilio.sid || '',
        twilioAuthToken: cachedTwilio.token || ''
      });
      return;
    }

    if (hasLoadedTwilioCredsRef.current || twilioCredentialsRequested.get(authKey)) return;

    hasLoadedTwilioCredsRef.current = true;
    twilioCredentialsRequested.set(authKey, true);

    const loadTwilioCreds = async () => {
      try {
        const response = await apiGet('/integrations/twilio/creds', { auth: true });
        const currentAuth = auth || {};
        const nextAuth = {
          ...currentAuth,
          ...(response && typeof response === 'object' ? response : {}),
          twilio_status:
            typeof response?.twilio_status === 'boolean'
              ? response.twilio_status
              : true
        };

        login(nextAuth);
        const nextTwilioCredentials = {
          sid: nextAuth.twilio_sid || response?.account_sid || '',
          token: nextAuth.twilio_auth_token || response?.auth_token || ''
        };
        setTwilioCredentials(nextTwilioCredentials);
        twilioCredentialsCache.set(authKey, nextTwilioCredentials);
        setTwilioForm({
          twilioSid: nextTwilioCredentials.sid,
          twilioAuthToken: nextTwilioCredentials.token
        });
      } catch (error) {
        setFlashMessage({
          type: 'error',
          message: error.message || 'Unable to load Twilio credentials right now.'
        });
      }
    };

    loadTwilioCreds();
  }, [authKey, twilioConnected]);

  const handleConfirmDisconnectInstagram = async () => {
    setIsDisconnectingInstagram(true);
    setFlashMessage({ message: '', type: 'error' });

    try {
      const response = await apiPatch('/integrations/ig/disconnect', null, { auth: true });
      const currentAuth = auth || {};
      const nextAuth = {
        ...currentAuth,
        ...(response && typeof response === 'object' ? response : {}),
        instagram_status: false
      };
      login(nextAuth);
      setFlashMessage({
        type: 'success',
        message: 'Instagram disconnected successfully.'
      });
      setShowDisconnectInstagramModal(false);
    } catch (error) {
      setFlashMessage({
        type: 'error',
        message: error.message || 'Unable to disconnect Instagram right now.'
      });
      setShowDisconnectInstagramModal(false);
    } finally {
      setIsDisconnectingInstagram(false);
    }
  };

  const handleConfirmDisconnectTwilio = async () => {
    setIsDisconnectingTwilio(true);
    setFlashMessage({ message: '', type: 'error' });

    try {
      const response = await apiPatch(
        '/integrations/twilio/disconnect',
        null,
        { auth: true }
      );

      const currentAuth = auth || {};
      const nextAuth = {
        ...currentAuth,
        ...(response && typeof response === 'object' ? response : {}),
        twilio_status: false,
        twilio_sid: '',
        twilio_auth_token: ''
      };

      login(nextAuth);
      setTwilioCredentials({ sid: '', token: '' });
      twilioCredentialsCache.delete(authKey);
      twilioCredentialsRequested.delete(authKey);
      setShowTwilioToken(false);
      setShowTwilioModalToken(false);
      setShowDisconnectTwilioModal(false);
      setFlashMessage({
        type: 'success',
        message: 'Twilio disconnected successfully.'
      });
    } catch (error) {
      setShowDisconnectTwilioModal(false);
      setFlashMessage({
        type: 'error',
        message: error.message || 'Unable to disconnect Twilio right now.'
      });
    } finally {
      setIsDisconnectingTwilio(false);
    }
  };

  const handleOpenTwilioModal = () => {
    const nextCredentials = twilioConnected ? twilioCredentials : { sid: '', token: '' };
    setTwilioForm({
      twilioSid: nextCredentials.sid || '',
      twilioAuthToken: nextCredentials.token || ''
    });
    setTwilioFormErrors({ twilioSid: '', twilioAuthToken: '' });
    setShowTwilioModalToken(false);
    setShowTwilioModal(true);
  };

  const handleChangeTwilioForm = (field, value) => {
    setTwilioForm((prev) => ({ ...prev, [field]: value }));
    setTwilioFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleConfirmTwilio = async () => {
    const nextErrors = {
      twilioSid: twilioForm.twilioSid.trim() ? '' : 'Twilio SID is required.',
      twilioAuthToken: twilioForm.twilioAuthToken.trim() ? '' : 'Twilio Auth Token is required.'
    };
    setTwilioFormErrors(nextErrors);

    if (nextErrors.twilioSid || nextErrors.twilioAuthToken) {
      return;
    }

    setIsSavingTwilio(true);
    setFlashMessage({ message: '', type: 'error' });

    try {
      const response = await apiPost(
        '/integrations/twilio/connect',
        {
          account_sid: twilioForm.twilioSid.trim(),
          auth_token: twilioForm.twilioAuthToken.trim()
        },
        { auth: true }
      );

      const currentAuth = auth || {};
      const nextAuth = {
        ...currentAuth,
        ...(response && typeof response === 'object' ? response : {}),
        twilio_sid: twilioForm.twilioSid.trim(),
        twilio_auth_token: twilioForm.twilioAuthToken.trim(),
        twilio_status:
          typeof response?.twilio_status === 'boolean'
            ? response.twilio_status
            : true
      };

      login(nextAuth);
      setTwilioCredentials({
        sid: nextAuth.twilio_sid || twilioForm.twilioSid.trim(),
        token: nextAuth.twilio_auth_token || twilioForm.twilioAuthToken.trim()
      });
      twilioCredentialsCache.set(authKey, {
        sid: nextAuth.twilio_sid || twilioForm.twilioSid.trim(),
        token: nextAuth.twilio_auth_token || twilioForm.twilioAuthToken.trim()
      });
      twilioCredentialsRequested.set(authKey, true);
      setShowTwilioModalToken(false);
      setShowTwilioModal(false);
      setFlashMessage({
        type: 'success',
        message: 'Twilio connected successfully.'
      });
    } catch (error) {
      setFlashMessage({
        type: 'error',
        message: error.message || 'Unable to save Twilio credentials right now.'
      });
    } finally {
      setIsSavingTwilio(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code') || '';
    const state = params.get('state') || '';
    if (!code || !state || state !== instagramState) return;
    if (!code || handledInstagramCodeRef.current === code) return;

    handledInstagramCodeRef.current = code;
    setIsExchangingInstagramCode(true);
    setFlashMessage({ message: '', type: 'error' });

    const exchangeInstagramCode = async () => {
      try {
        const response = await apiPost(
          '/integrations/ig/connect',
          { code },
          { auth: true }
        );

        const currentAuth = auth || {};
        const nextAuth = {
          ...currentAuth,
          ...(response && typeof response === 'object' ? response : {}),
          instagram_status:
            typeof response?.instagram_status === 'boolean'
              ? response.instagram_status
              : true
        };

        login(nextAuth);
        instagramConfigRequested.set(authKey, true);
        setFlashMessage({
          type: 'success',
          message: 'Instagram connected successfully.'
        });

        const cleanedUrl = new URL(window.location.href);
        cleanedUrl.searchParams.delete('code');
        window.history.replaceState({}, '', `${cleanedUrl.pathname}${cleanedUrl.search}${cleanedUrl.hash}`);
      } catch (error) {
        setFlashMessage({
          type: 'error',
          message: error.message || 'Unable to connect Instagram right now.'
        });
        const cleanedUrl = new URL(window.location.href);
        cleanedUrl.searchParams.delete('code');
        window.history.replaceState({}, '', `${cleanedUrl.pathname}${cleanedUrl.search}${cleanedUrl.hash}`);
      } finally {
        setIsExchangingInstagramCode(false);
      }
    };

    exchangeInstagramCode();
  }, [instagramState, location.search]);

  useEffect(() => {
    if (location.search) {
      // Debug: inspect the exact Square callback URL in the browser console.
      console.log('Square callback URL:', `${window.location.pathname}${window.location.search}${window.location.hash}`);
    }

    const params = new URLSearchParams(location.search);
    const code = params.get('code') || '';
    const state = params.get('state') || '';
    const requestKey = `${code}:${state}`;
    if (!code || !state || handledSquareCodeRef.current === requestKey) return;

    handledSquareCodeRef.current = requestKey;
    setFlashMessage({ message: '', type: 'error' });

    const storedState = sessionStorage.getItem('csrf_state_code') || '';
    sessionStorage.removeItem('csrf_state_code');

    if (!storedState || storedState !== state) {
      setFlashMessage({
        type: 'error',
        message: 'Square security check failed. Please try connecting again.'
      });
      const cleanedUrl = new URL(window.location.href);
      cleanedUrl.searchParams.delete('code');
      cleanedUrl.searchParams.delete('state');
      window.history.replaceState({}, '', `${cleanedUrl.pathname}${cleanedUrl.search}${cleanedUrl.hash}`);
      return;
    }

    const cleanedUrl = new URL(window.location.href);
    cleanedUrl.searchParams.delete('code');
    cleanedUrl.searchParams.delete('state');
    window.history.replaceState({}, '', `${cleanedUrl.pathname}${cleanedUrl.search}${cleanedUrl.hash}`);

    const exchangeSquareCode = async () => {
      setIsExchangingSquareCode(true);
      try {
        const response = await apiPost(
          '/integrations/square/connect',
          { code },
          { auth: true }
        );

        const currentAuth = auth || {};
        const nextAuth = {
          ...currentAuth,
          ...(response && typeof response === 'object' ? response : {}),
          square_status:
            typeof response?.square_status === 'boolean'
              ? response.square_status
              : true
        };

        login(nextAuth);
        setFlashMessage({
          type: 'success',
          message: 'Square connected successfully.'
        });
      } catch (error) {
        setFlashMessage({
          type: 'error',
          message: error.message || 'Unable to connect Square right now.'
        });
      } finally {
        setIsExchangingSquareCode(false);
      }
    };

    exchangeSquareCode();
  }, [auth, login, location.search]);

  return (
    <div className="space-y-6">
      {isExchangingInstagramCode ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#101010] p-6 text-center shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:overflow-y-auto">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Setting up your Instagram connection...</p>
            </div>
          </div>
        </div>
      ) : null}

      {isExchangingSquareCode ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#101010] p-6 text-center shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:overflow-y-auto">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Connecting your Square account...</p>
              <p className="text-sm text-gray-400">Please wait while we finish the connection.</p>
            </div>
          </div>
        </div>
      ) : null}

      <PageHeader
        title="Integrations"
        subtitle="Connect your business tools so Kaira can manage conversations, bookings, and payments seamlessly across every channel."
      />

      <FloatingMessage
        message={flashMessage.message}
        type={flashMessage.type}
        onClose={() => setFlashMessage({ message: '', type: 'error' })}
      />
      <ConfirmModal
        open={showDisconnectInstagramModal}
        title="Disconnect Instagram?"
        message="Once disconnected, Kaira will no longer be able to respond to your Instagram DMs or manage conversations on your behalf. Your Instagram account will remain intact - you can reconnect anytime from the Integrations page."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmDisabled={isDisconnectingInstagram}
        onCancel={() => setShowDisconnectInstagramModal(false)}
        onConfirm={handleConfirmDisconnectInstagram}
      />
      <ConfirmModal
        open={showDisconnectTwilioModal}
        title="Disconnect Twilio?"
        message="Once disconnected, Kaira will no longer be able to manage WhatsApp, SMS and phone calls through Twilio. You can reconnect anytime from the Integrations page."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmDisabled={isDisconnectingTwilio}
        onCancel={() => setShowDisconnectTwilioModal(false)}
        onConfirm={handleConfirmDisconnectTwilio}
      />
      <ConfirmModal
        open={showDisconnectSquareModal}
        title="Disconnect Square?"
        message="Once disconnected, Kaira will no longer be able to keep your booking and payment workflows aligned through Square. You can reconnect anytime from the Integrations page."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmDisabled={isDisconnectingSquare}
        onCancel={() => setShowDisconnectSquareModal(false)}
        onConfirm={handleConfirmDisconnectSquare}
      />
      <TwilioCredentialsModal
        open={showTwilioModal}
        values={twilioForm}
        errors={twilioFormErrors}
        loading={isSavingTwilio}
        tokenVisible={showTwilioModalToken}
        onChange={handleChangeTwilioForm}
        onToggleTokenVisible={() => setShowTwilioModalToken((prev) => !prev)}
        onCancel={() => setShowTwilioModal(false)}
        onConfirm={handleConfirmTwilio}
      />

      <section className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <div className="space-y-2 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle title="Twilio" icon={<img src={twilioLogo} alt="" className="h-6 w-6 object-contain" />} />
            <StatusChip connected={twilioConnected} />
          </div>
          <p className="text-sm text-gray-400">
            Connect Twilio so Kaira can manage WhatsApp, SMS and phone calls.
          </p>
          <div className="-mt-2 border-t border-white/10" />
          <div className="pt-4">
            <p className="text-sm font-medium text-white">
              Before you connect, make sure your Twilio account has the following enabled:
            </p>
            <ul className="mt-3 space-y-3">
              <BulletItem>A verified Twilio phone number with SMS capabilities</BulletItem>
              <BulletItem>Voice enabled on your Twilio number for call-based automations</BulletItem>
              <BulletItem>
                WhatsApp Business approved and configured via Twilio&apos;s WhatsApp Sandbox or approved sender
              </BulletItem>
              <BulletItem>Your Account SID and Auth Token ready from the Twilio Console at console.twilio.com</BulletItem>
            </ul>
          </div>
        </div>
        <div className="-mt-2 border-t border-white/10" />

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Twilio SID</span>
            <input
              type="text"
              readOnly
              value={twilioConnected ? twilioCredentials.sid || '' : ''}
              className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] px-3 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none read-only:cursor-not-allowed"
              placeholder="Enter Twilio SID"
            />
          </label>
          <SecretField
            label="Twilio Auth Token"
            value={twilioConnected ? twilioCredentials.token || '' : ''}
            placeholder="Enter Twilio Auth Token"
            visible={showTwilioToken}
            onToggleVisible={() => setShowTwilioToken((prev) => !prev)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenTwilioModal}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              {twilioConnected ? 'Edit Credentials' : 'Connect Twilio'}
            </button>
            {twilioConnected ? (
              <button
                type="button"
                onClick={() => setShowDisconnectTwilioModal(true)}
                className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Disconnect Twilio
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <div className="space-y-2 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle
              title="Instagram"
              icon={<img src={instagramLogo} alt="" className="h-6 w-6 object-contain" />}
            />
            <StatusChip connected={instagramConnected} />
          </div>
          <p className="text-sm text-gray-400">
            Connect Instagram so Kaira can keep your social messaging connected.
          </p>
          <div className="-mt-2 border-t border-white/10" />
          <div className="pt-4">
            <p className="text-sm font-medium text-white">
              Before you connect, make sure your Instagram account meets the following requirements:
            </p>
            <ul className="mt-3 space-y-3">
              <BulletItem>Your Instagram account must be a Professional Account (Business or Creator)</BulletItem>
            </ul>
            <p className="mt-3 text-sm italic text-gray-300">
              Don&apos;t have a Professional account? Go to your Instagram Settings → Account → Switch to Professional
              Account.
            </p>
          </div>
        </div>
        <div className="-mt-2 border-t border-white/10" />

        <div className="flex justify-start">
          <button
            type="button"
            disabled={isExchangingInstagramCode}
            onClick={() => {
              if (instagramConnected) {
                setShowDisconnectInstagramModal(true);
                return;
              }

              if (instagramLoginUrl) {
                const redirectUrl = new URL(instagramLoginUrl, window.location.origin);
                if (instagramState) {
                  redirectUrl.searchParams.set('state', instagramState);
                }
                window.location.href = redirectUrl.toString();
              } else {
                setFlashMessage({
                  type: 'error',
                  message: 'Instagram login URL is not configured.'
                });
              }
            }}
            className={[
              'inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
              instagramConnected
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[#16a34a] text-white hover:bg-[#15803d]'
            ].join(' ')}
          >
            {instagramConnected ? 'Disconnect Instagram' : 'Connect Instagram'}
          </button>
        </div>
      </section>

      {showSquareSection ? (
        <section className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
          <div className="space-y-2 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle title="Square" icon={<img src={squareLogo} alt="" className="h-6 w-6 object-contain" />} />
              <StatusChip connected={squareConnected} />
            </div>
            <p className="text-sm text-gray-400">
              Connect Square to keep booking and payment workflows aligned.
            </p>
          </div>
          <div className="-mt-2 border-t border-white/10" />

          <div className="flex justify-start">
              <button
                type="button"
                onClick={() => {
                  if (squareConnected) {
                    setShowDisconnectSquareModal(true);
                    return;
                  }

                  handleConnectSquare();
                }}
                disabled={isExchangingSquareCode}
              className={[
                'inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                squareConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-[#16a34a] hover:bg-[#15803d]'
              ].join(' ')}
            >
              {squareConnected ? 'Disconnect Square' : 'Connect Square'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Integrations;
