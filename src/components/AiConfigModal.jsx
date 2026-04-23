import { useEffect, useMemo, useState } from 'react';
import { apiPost } from '../services/apiClient.js';

const toneOptions = [
  'professional',
  'friendly',
  'empathetic',
  'warm',
  'calming',
  'motivating',
  'concise',
  'luxurious'
];

const countWords = (value = '') =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const AiConfigModal = ({ open, onComplete, onClose, onToast, initialValues = {} }) => {
  const [tone, setTone] = useState(initialValues.tone || '');
  const [businessContext, setBusinessContext] = useState(initialValues.business_context || '');
  const [instructions, setInstructions] = useState(initialValues.instructions || '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const businessWordCount = useMemo(() => countWords(businessContext), [businessContext]);
  const instructionsWordCount = useMemo(() => countWords(instructions), [instructions]);

  useEffect(() => {
    if (!open) return;
    setTone(initialValues.tone || '');
    setBusinessContext(initialValues.business_context || '');
    setInstructions(initialValues.instructions || '');
    setErrors({});
  }, [open, initialValues]);

  if (!open) return null;

  const validate = () => {
    const nextErrors = {};

    if (!tone) nextErrors.tone = 'Communication style is required.';
    if (!businessContext.trim()) nextErrors.businessContext = 'About your business is required.';
    if (!instructions.trim()) nextErrors.instructions = 'Special instructions are required.';

    if (businessWordCount > 500) {
      nextErrors.businessContext = 'About your business cannot exceed 500 words.';
    }
    if (instructionsWordCount > 200) {
      nextErrors.instructions = 'Special instructions cannot exceed 200 words.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        tone,
        instructions: instructions.trim(),
        business_context: businessContext.trim()
      };

      await apiPost(
        '/ai_config',
        payload,
        { auth: true }
      );
      onToast?.({
        type: 'success',
        message: 'Kaira has been customized successfully.'
      });
      const nextPayload = {
        tone: payload.tone,
        instructions: payload.instructions,
        business_context: payload.business_context
      };
      onComplete?.(nextPayload);
    } catch (error) {
      onToast?.({
        type: 'error',
        message: error.message || 'Unable to save AI configuration.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl sm:p-8">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Communication Style <span className="text-red-400">*</span>
            </span>
            <select
              value={tone}
              onChange={(event) => {
                setTone(event.target.value);
                setErrors((prev) => ({ ...prev, tone: '' }));
              }}
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white focus:border-white/25 focus:outline-none"
            >
              <option value="" disabled>
                Select communication style
              </option>
              {toneOptions.map((option) => (
                <option key={option} value={option} className="bg-black">
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
            {errors.tone ? <p className="text-xs text-red-400">{errors.tone}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              About Your Business <span className="text-red-400">*</span>
            </span>
            <textarea
              value={businessContext}
              onChange={(event) => {
                setBusinessContext(event.target.value);
                setErrors((prev) => ({ ...prev, businessContext: '' }));
              }}
              rows={5}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
              placeholder="Tell Kaira about your business, brand voice, and how you serve customers."
            />
            <p className="text-right text-xs text-gray-400">{businessWordCount}/500 words</p>
            {errors.businessContext ? <p className="text-xs text-red-400">{errors.businessContext}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Special Instructions <span className="text-red-400">*</span>
            </span>
            <textarea
              value={instructions}
              onChange={(event) => {
                setInstructions(event.target.value);
                setErrors((prev) => ({ ...prev, instructions: '' }));
              }}
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
              placeholder="Define rules, do’s and don’ts, and message constraints."
            />
            <p className="text-right text-xs text-gray-400">{instructionsWordCount}/200 words</p>
            {errors.instructions ? <p className="text-xs text-red-400">{errors.instructions}</p> : null}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Saving
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiConfigModal;
