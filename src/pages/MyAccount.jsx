import { useEffect, useRef, useState } from 'react';
import { parseAuth } from '../utils/tokenUtils.js';
import { toTitleCase } from '../utils/formatters.js';

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

const MyAccount = () => {
  const auth = parseAuth() || {};
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const businessNameInputRef = useRef(null);
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
  };

  const handleCancelEdit = () => {
    setProfileDraft({
      business_name: auth.business_name || '',
      industry: auth.industry || '',
      email: auth.email || '',
      phone: auth.phone || '',
      address: auth.address || ''
    });
    setIsEditingProfile(false);
  };

  const handleDoneEdit = () => {
    const nextAuth = {
      ...auth,
      business_name: profileDraft.business_name,
      industry: profileDraft.industry,
      email: profileDraft.email,
      phone: profileDraft.phone,
      address: profileDraft.address
    };
    localStorage.setItem('auth', JSON.stringify(nextAuth));
    setIsEditingProfile(false);
  };

  useEffect(() => {
    if (isEditingProfile && businessNameInputRef.current) {
      businessNameInputRef.current.focus();
    }
  }, [isEditingProfile]);

  return (
    <div className="space-y-6">
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
              onChange={(event) => setProfileValue('business_name', event.target.value)}
              className={profileInputClass}
              placeholder="—"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Industry</span>
            <input
              readOnly={!isEditingProfile}
              value={profileDraft.industry}
              onChange={(event) => setProfileValue('industry', event.target.value)}
              className={profileInputClass}
              placeholder="—"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Email</span>
            <input
              readOnly={!isEditingProfile}
              value={profileDraft.email}
              onChange={(event) => setProfileValue('email', event.target.value)}
              className={profileInputClass}
              placeholder="—"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Phone Number</span>
            <input
              readOnly={!isEditingProfile}
              value={profileDraft.phone}
              onChange={(event) => setProfileValue('phone', event.target.value)}
              className={profileInputClass}
              placeholder="—"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Address</span>
          <input
            readOnly={!isEditingProfile}
            value={profileDraft.address}
            onChange={(event) => setProfileValue('address', event.target.value)}
            className={profileInputClass}
            placeholder="—"
          />
        </label>

        <div className="flex justify-end">
          {isEditingProfile ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex h-9 items-center justify-center rounded-md border border-white/20 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:border-white/35 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDoneEdit}
                className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-soft">
        <div className="space-y-1 pb-4">
          <div className="flex flex-wrap items-center gap-3">
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
