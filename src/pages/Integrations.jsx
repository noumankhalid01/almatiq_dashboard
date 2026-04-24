import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import instagramLogo from '../assets/instagram_logo.png';
import squareLogo from '../assets/square_logo.png';
import twilioLogo from '../assets/twilio_logo.png';
import { apiPatch, apiPost } from '../services/apiClient.js';
import { parseAuth, saveAuth } from '../utils/tokenUtils.js';

const emptyAction = (label) => () => {
  void label;
};

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
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101010] p-6 text-center shadow-2xl sm:p-8">
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

const Integrations = () => {
  const location = useLocation();
  const auth = parseAuth() || {};
  const currentPlanId = Number(auth?.current_plan?.plan_id || 0);
  const showSquareSection = currentPlanId !== 1;
  const instagramLoginUrl = import.meta.env.VITE_INSTAGRAM_LOGIN_URL || '';
  const instagramState = String(auth?.id || auth?.tenant_id || '');
  const twilioSidRef = useRef(null);
  const handledInstagramCodeRef = useRef('');
  const [isEditingTwilio, setIsEditingTwilio] = useState(false);
  const [showTwilioSecrets, setShowTwilioSecrets] = useState(false);
  const [flashMessage, setFlashMessage] = useState({ message: '', type: 'error' });
  const [isExchangingInstagramCode, setIsExchangingInstagramCode] = useState(false);
  const [showDisconnectInstagramModal, setShowDisconnectInstagramModal] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);
  const twilioConnected = Boolean(auth.twilio_status);
  const instagramConnected = Boolean(auth.instagram_status);
  const squareConnected = Boolean(auth.square_status);

  const twilioInputClass = [
    'h-11 w-full rounded-md px-3 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none read-only:cursor-not-allowed',
    isEditingTwilio
      ? 'border border-emerald-300/45 bg-emerald-400/10 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/35'
      : 'border border-white/15 bg-white/[0.06] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30'
  ].join(' ');

  useEffect(() => {
    if (isEditingTwilio && twilioSidRef.current) {
      twilioSidRef.current.focus();
    }
  }, [isEditingTwilio]);

  const handleConfirmDisconnectInstagram = async () => {
    setIsDisconnectingInstagram(true);
    setFlashMessage({ message: '', type: 'error' });

    try {
      const response = await apiPatch('/integrations/ig/disconnect', null, { auth: true });
      const currentAuth = parseAuth() || {};
      saveAuth({
        ...currentAuth,
        ...(response && typeof response === 'object' ? response : {}),
        instagram_status: false
      });
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code') || '';
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

        const currentAuth = parseAuth() || {};
        const nextAuth = {
          ...currentAuth,
          ...(response && typeof response === 'object' ? response : {}),
          instagram_status:
            typeof response?.instagram_status === 'boolean'
              ? response.instagram_status
              : true
        };

        saveAuth(nextAuth);
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
  }, [location.search]);

  return (
    <div className="space-y-6">
      {isExchangingInstagramCode ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#101010] p-6 text-center shadow-2xl">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">Setting up your Instagram connection...</p>
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

      <section className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <div className="space-y-2 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle title="Twilio" icon={<img src={twilioLogo} alt="" className="h-6 w-6 object-contain" />} />
            <StatusChip connected={twilioConnected} />
          </div>
          <p className="text-sm text-gray-400">
            Keep your messaging credentials ready for SMS and call-based automations.
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
              ref={twilioSidRef}
              type={showTwilioSecrets ? 'text' : 'password'}
              readOnly={!isEditingTwilio}
              className={twilioInputClass}
              placeholder="Enter Twilio SID"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              Twilio Auth Token
            </span>
            <input
              type={showTwilioSecrets ? 'text' : 'password'}
              readOnly={!isEditingTwilio}
              className={twilioInputClass}
              placeholder="Enter Twilio Auth Token"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isEditingTwilio ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingTwilio(false);
                  setShowTwilioSecrets(false);
                }}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTwilio(false);
                  setShowTwilioSecrets(false);
                }}
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowTwilioSecrets(true);
                setIsEditingTwilio(true);
              }}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              Add Credentials
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowTwilioSecrets((prev) => !prev)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
          >
            {showTwilioSecrets ? 'Hide Credentials' : 'Show Credentials'}
          </button>
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
              onClick={emptyAction('Connect Square')}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              Connect Square
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Integrations;
