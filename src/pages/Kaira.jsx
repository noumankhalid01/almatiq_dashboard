import { useEffect, useState } from 'react';
import AiConfigModal from '../components/AiConfigModal.jsx';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { apiGet } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

const KAIRA_COPY =
  "The more Kaira knows about your business, the more it sounds like you. Share your story to give Kaira context, and use special instructions to define exactly what Kaira should and shouldn't do - your rules, your way";

const hasKairaConfigData = (config) =>
  Boolean(config?.tone || config?.business_context || config?.instructions);

const kairaConfigCache = new Map();
const kairaConfigRequested = new Map();

const Kaira = () => {
  const { auth, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');
  const [kairaConfig, setKairaConfig] = useState({
    tone: '',
    business_context: '',
    instructions: ''
  });
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState({ message: '', type: 'error' });
  const [flashError, setFlashError] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const onboardingStep = Number(auth?.onboarding_step || 0);

  useEffect(() => {
    if (onboardingStep <= 2) return;
    const cachedConfig = kairaConfigCache.get(authKey);
    if (cachedConfig && !hasKairaConfigData(kairaConfig)) {
      setKairaConfig(cachedConfig);
      return;
    }

    if (hasKairaConfigData(kairaConfig)) {
      kairaConfigCache.set(authKey, kairaConfig);
      return;
    }

    if (kairaConfigRequested.get(authKey)) return;
    kairaConfigRequested.set(authKey, true);

    const loadAiConfig = async () => {
      setLoadingConfig(true);
      setError('');
      try {
        const response = await apiGet('/ai_config', { auth: true });
        const nextConfig = {
          tone: response?.tone || '',
          business_context: response?.business_context || '',
          instructions: response?.instructions || ''
        };
        setKairaConfig(nextConfig);
        kairaConfigCache.set(authKey, nextConfig);
      } catch (err) {
        setError(err?.message || 'Unable to fetch Kaira configuration.');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadAiConfig();
  }, [authKey, kairaConfig, onboardingStep]);

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  useEffect(() => {
    if (flashMessage.message) {
      const timer = window.setTimeout(() => {
        setFlashMessage({ message: '', type: 'error' });
      }, 10000);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [flashMessage.message]);

  return (
    <div className="space-y-6">
      <PageHeader title="Kaira" subtitle={KAIRA_COPY} />

      <FloatingMessage message={flashError} type="error" onClose={() => setFlashError('')} />
      <FloatingMessage
        message={flashMessage.message}
        type={flashMessage.type}
        onClose={() => setFlashMessage({ message: '', type: 'error' })}
      />

      <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            Communication Style
          </span>
          <input
            value={kairaConfig.tone}
            readOnly
            className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] px-3 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none"
            placeholder={loadingConfig ? 'Loading communication style...' : 'No style configured yet'}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            About Your Business
          </span>
          <textarea
            value={kairaConfig.business_context}
            readOnly
            rows={5}
            className="w-full rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none"
            placeholder={loadingConfig ? 'Loading business context...' : 'No business context configured yet'}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            Special Instructions
          </span>
          <textarea
            value={kairaConfig.instructions}
            readOnly
            rows={4}
            className="w-full rounded-md border border-white/15 bg-white/[0.06] px-3 py-2 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none"
            placeholder={loadingConfig ? 'Loading special instructions...' : 'No instructions configured yet'}
          />
        </label>

        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            Customize Kaira
          </button>
        </div>
      </div>

      <AiConfigModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValues={kairaConfig}
        onToast={(nextMessage) => setFlashMessage(nextMessage)}
        onComplete={(payload) => {
          setKairaConfig(payload);
          kairaConfigCache.set(authKey, payload);
          kairaConfigRequested.set(authKey, true);

          if (auth) {
            login({ ...auth, onboarding_step: 3 });
          }

          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Kaira;
