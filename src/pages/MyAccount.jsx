import { useEffect, useRef, useState } from 'react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import FloatingMessage from '../components/FloatingMessage.jsx';
import { apiPatch } from '../services/apiClient.js';
import { parseAuth } from '../utils/tokenUtils.js';
import { toTitleCase } from '../utils/formatters.js';
import { sanitizeEmail, sanitizePhone, sanitizeText, toTitleCaseLive } from '../utils/inputSanitizers.js';

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;
const normalizePhoneNumber = (value) => {
  const compact = sanitizePhone(value).replace(/[\s()-]/g, '');
  if (!compact) return '';
  return compact.startsWith('+') ? compact : `+${compact}`;
};

const MyAccount = () => {
  const auth = parseAuth() || {};
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const businessNameInputRef = useRef(null);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [flashMessage, setFlashMessage] = useState({ message: '', type: 'error' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    business_name: auth.business_name || '',
    industry: auth.industry || '',
    email: auth.email || '',
    phone: auth.phone || '',
    address: auth.address || ''
  });
  const currentPlan = auth.current_plan || {};
  const planStatus = (currentPlan.subscription_status || '').toLowerCase();
  const statusIsActive = planStatus === 'active';
  const profileInputClass = [
    'h-11 w-full rounded-md px-3 text-base font-normal placeholder:text-gray-500 focus:outline-none read-only:cursor-not-allowed',
    isEditingProfile
      ? 'border border-emerald-300/45 bg-emerald-400/10 text-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/35'
      : 'border border-white/15 bg-white/[0.06] text-white focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30'
  ].join(' ');

  const setProfileValue = (key, value) => {
    setProfileDraft((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setProfileSaveError('');
    setProfileSaveSuccess('');
  };

  const handleCancelEdit = () => {
    setProfileDraft({
      business_name: auth.business_name || '',
      industry: auth.industry || '',
      email: auth.email || '',
      phone: auth.phone || '',
      address: auth.address || ''
    });
    setFieldErrors({});
    setProfileSaveError('');
    setProfileSaveSuccess('');
    setIsEditingProfile(false);
  };

  const validateProfile = () => {
    const nextErrors = {};
    const normalizedPhone = normalizePhoneNumber(profileDraft.phone);

    if (!profileDraft.business_name.trim()) nextErrors.business_name = 'Business name is required.';
    if (!profileDraft.industry.trim()) nextErrors.industry = 'Industry is required.';
    if (!profileDraft.address.trim()) nextErrors.address = 'Address is required.';
    if (!profileDraft.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileDraft.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDoneEdit = async () => {
    if (!validateProfile()) return;

    setSavingProfile(true);
    setProfileSaveError('');
    setProfileSaveSuccess('');
    try {
      const payload = {
        business_name: profileDraft.business_name.trim(),
        industry: profileDraft.industry.trim(),
        email: profileDraft.email.trim(),
        phone: normalizePhoneNumber(profileDraft.phone),
        address: profileDraft.address.trim()
      };

      const updatedTenant = await apiPatch('/tenant/update', payload, { auth: true });
      const nextAuth = {
        ...auth,
        business_name: updatedTenant.business_name ?? payload.business_name,
        industry: updatedTenant.industry ?? payload.industry,
        email: updatedTenant.email ?? payload.email,
        phone: updatedTenant.phone ?? payload.phone,
        address: updatedTenant.address ?? payload.address
      };

      localStorage.setItem('auth', JSON.stringify(nextAuth));
      setProfileDraft({
        business_name: nextAuth.business_name || '',
        industry: nextAuth.industry || '',
        email: nextAuth.email || '',
        phone: nextAuth.phone || '',
        address: nextAuth.address || ''
      });
      setFieldErrors({});
      setIsEditingProfile(false);
      setProfileSaveSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileSaveError(error.message || 'Unable to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (isEditingProfile && businessNameInputRef.current) {
      businessNameInputRef.current.focus();
    }
  }, [isEditingProfile]);

  useEffect(() => {
    if (profileSaveError) {
      setFlashMessage({ message: profileSaveError, type: 'error' });
    }
  }, [profileSaveError]);

  useEffect(() => {
    if (profileSaveSuccess) {
      setFlashMessage({ message: profileSaveSuccess, type: 'success' });
    }
  }, [profileSaveSuccess]);

  return (
    <div className="space-y-6">
      <FloatingMessage
        message={flashMessage.message}
        type={flashMessage.type}
        onClose={() => setFlashMessage({ message: '', type: 'error' })}
      />

      <div className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <div className="space-y-2 pb-4">
          <h2 className="font-display text-xl font-semibold text-white">Your Profile</h2>
          <p className="text-sm text-gray-400">
            Keep your business details up to date so Kaira always has the right information.
          </p>
        </div>
        <div className="-mt-2 border-t border-white/10" />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Business Name</span>
            <input
              ref={businessNameInputRef}
              readOnly={!isEditingProfile}
              value={profileDraft.business_name}
              onChange={(event) => setProfileValue('business_name', toTitleCaseLive(event.target.value))}
              className={profileInputClass}
              placeholder="—"
            />
            {fieldErrors.business_name ? (
              <p className="text-xs text-red-400">{fieldErrors.business_name}</p>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Industry</span>
            <input
              readOnly={!isEditingProfile}
              value={profileDraft.industry}
              onChange={(event) => setProfileValue('industry', toTitleCaseLive(event.target.value))}
              className={profileInputClass}
              placeholder="—"
            />
            {fieldErrors.industry ? <p className="text-xs text-red-400">{fieldErrors.industry}</p> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Email</span>
            <input
              readOnly={!isEditingProfile}
              value={profileDraft.email}
              onChange={(event) => setProfileValue('email', sanitizeEmail(event.target.value))}
              className={profileInputClass}
              placeholder="—"
            />
            {fieldErrors.email ? <p className="text-xs text-red-400">{fieldErrors.email}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Phone Number</span>
            <input
              readOnly={!isEditingProfile}
              value={profileDraft.phone}
              onChange={(event) => setProfileValue('phone', sanitizePhone(event.target.value))}
              className={profileInputClass}
              placeholder="—"
            />
            {fieldErrors.phone ? <p className="text-xs text-red-400">{fieldErrors.phone}</p> : null}
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Address</span>
          <input
            readOnly={!isEditingProfile}
            value={profileDraft.address}
            onChange={(event) => setProfileValue('address', sanitizeText(event.target.value))}
            className={profileInputClass}
            placeholder="—"
          />
          {fieldErrors.address ? <p className="text-xs text-red-400">{fieldErrors.address}</p> : null}
        </label>

        <div className="flex justify-start">
          {isEditingProfile ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDoneEdit}
                disabled={savingProfile}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingProfile}
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/20 bg-white/[0.04] px-5 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <div className="space-y-1 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-white">Subscription & Billing</h2>
            <span
              className={[
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                statusIsActive
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
              ].join(' ')}
            >
              {currentPlan.subscription_status ? toTitleCase(currentPlan.subscription_status) : '—'}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Your current plan and billing details. Upgrade anytime to unlock more features, or contact
            support for any queries or changes to your subscription.
          </p>
        </div>
        <div className="-mt-2 border-t border-white/10" />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Plan</span>
            <input
              readOnly
              value={currentPlan.plan_name || ''}
              className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] px-3 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none"
              placeholder="—"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Price</span>
            <input
              readOnly
              value={currentPlan.price ? formatPrice(currentPlan.price) : ''}
              className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] px-3 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none"
              placeholder="—"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Billing Interval</span>
            <input
              readOnly
              value={currentPlan.billing_interval ? toTitleCase(currentPlan.billing_interval) : ''}
              className="h-11 w-full rounded-md border border-white/15 bg-white/[0.06] px-3 text-base font-normal text-white placeholder:text-gray-500 focus:outline-none"
              placeholder="—"
            />
          </label>
        </div>

      </div>
    </div>
  );
};

export default MyAccount;
