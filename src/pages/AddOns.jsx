import { useCallback, useEffect, useMemo, useState } from 'react';
import FloatingMessage from '../components/FloatingMessage.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Table from '../components/Table.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiGet, apiPatch, apiPost } from '../services/apiClient.js';
import { formatDateTime, toTitleCase } from '../utils/formatters.js';

const addOnsCache = new Map();
const addOnsRequested = new Map();

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;
const toFixedInputValue = (value) => (value === '' || value === null || value === undefined ? '' : Number(value).toFixed(2));
const normalizeDecimalInput = (value) => {
  const normalized = String(value).replace(/[^\d.]/g, '');
  const parts = normalized.split('.');
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
};
const countWords = (value = '') =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const emptyAddOnForm = {
  name: '',
  description: '',
  price: '',
  discount: '',
  duration_mins: '',
  is_active: 'true'
};

const normalizeAddOnForm = (addOn) => ({
  name: addOn?.name ?? '',
  description: addOn?.description ?? '',
  price: toFixedInputValue(addOn?.price),
  discount: toFixedInputValue(addOn?.discount),
  duration_mins: addOn?.duration_mins ?? addOn?.duration ?? '',
  is_active: addOn?.is_active === false ? 'false' : 'true'
});

const AddOnModal = ({ open, mode, form, loading, error, onClose, onChange, onSubmit }) => {
  if (!open) return null;

  const title = mode === 'edit' ? 'Edit Add On' : 'New Add On';
  const actionLabel = mode === 'edit' ? 'Update' : 'Add';

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:overflow-y-auto sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-gray-300 transition hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>

        <div className="space-y-1 pr-12">
          <h3 className="text-center font-display text-2xl font-semibold text-white">{title}</h3>
          <p className="text-center text-sm text-gray-400">
            Enter the add-on details below. All fields are required except duration.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Name <span className="text-red-400">*</span>
            </span>
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              maxLength={20}
              placeholder="Enter add-on name"
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Status <span className="text-red-400">*</span>
            </span>
            <select
              value={form.is_active}
              onChange={(event) => onChange('is_active', event.target.value)}
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white focus:border-white/25 focus:outline-none"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              Description <span className="text-red-400">*</span>
            </span>
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={5}
              placeholder="Enter add-on description"
              className="h-[140px] w-full resize-none rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
            />
            <p className="text-right text-xs text-gray-400">{countWords(form.description)}/50 words</p>
          </label>

          <div className="grid gap-6 pt-1 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">
                Price <span className="text-red-400">*</span>
              </span>
              <input
                value={form.price}
                onChange={(event) => onChange('price', normalizeDecimalInput(event.target.value))}
                onBlur={() => onChange('price', form.price === '' ? '' : Number(form.price).toFixed(2))}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="no-number-spinner h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">
                Discount <span className="text-red-400">*</span>
              </span>
              <input
                value={form.discount}
                onChange={(event) => onChange('discount', normalizeDecimalInput(event.target.value))}
                onBlur={() => onChange('discount', form.discount === '' ? '' : Number(form.discount).toFixed(2))}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="no-number-spinner h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Duration (mins)</span>
              <input
                value={form.duration_mins}
                onChange={(event) => onChange('duration_mins', event.target.value)}
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="Optional"
                className="no-number-spinner h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 text-white placeholder:text-gray-500 focus:border-white/25 focus:outline-none"
              />
            </label>
          </div>

          {error ? <p className="text-center text-sm text-rose-300">{error}</p> : null}
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#16a34a] px-8 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddOns = () => {
  const { auth } = useAuth();
  const authKey = String(auth?.id || auth?.tenant_id || auth?.email || 'default');
  const cachedEntry = addOnsCache.get(authKey);
  const [addOns, setAddOns] = useState(() => cachedEntry?.data || []);
  const [lastUpdated, setLastUpdated] = useState(() => cachedEntry?.updatedAt || null);
  const [loading, setLoading] = useState(() => !cachedEntry);
  const [error, setError] = useState('');
  const [flashError, setFlashError] = useState('');
  const [flashSuccess, setFlashSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOnModalOpen, setAddOnModalOpen] = useState(false);
  const [addOnModalMode, setAddOnModalMode] = useState('create');
  const [addOnModalLoading, setAddOnModalLoading] = useState(false);
  const [addOnModalError, setAddOnModalError] = useState('');
  const [addOnForm, setAddOnForm] = useState(emptyAddOnForm);
  const [editingAddOn, setEditingAddOn] = useState(null);

  const loadAddOns = useCallback(
    async ({ force = false } = {}) => {
      if (!force) {
        const cachedAddOns = addOnsCache.get(authKey);
        if (cachedAddOns) {
          setAddOns(cachedAddOns.data);
          setLastUpdated(cachedAddOns.updatedAt);
          setLoading(false);
          setError('');
          return;
        }

        if (addOnsRequested.get(authKey)) return;
        addOnsRequested.set(authKey, true);
      }

      setLoading(true);
      setError('');
      try {
        const response = await apiGet('/add_ons/list', { auth: true });
        const nextAddOns = Array.isArray(response) ? response : [];
        const updatedAt = new Date().toISOString();
        addOnsCache.set(authKey, { data: nextAddOns, updatedAt });
        setLastUpdated(updatedAt);
        setAddOns(nextAddOns);
      } catch (err) {
        setAddOns([]);
        setError(err?.message || 'Unable to fetch add-ons right now.');
      } finally {
        setLoading(false);
      }
    },
    [authKey]
  );

  useEffect(() => {
    loadAddOns();
  }, [loadAddOns]);

  useEffect(() => {
    if (error) setFlashError(error);
  }, [error]);

  useEffect(() => {
    if (addOnModalError) setFlashError(addOnModalError);
  }, [addOnModalError]);

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name', align: 'left', className: 'w-[22%]' },
      { key: 'description', label: 'Description', align: 'left', className: 'w-[31%]' },
      { key: 'price', label: 'Price', align: 'center', className: 'w-[9%]' },
      { key: 'discount', label: 'Discount', align: 'center', className: 'w-[9%]' },
      { key: 'duration', label: 'Duration (mins)', align: 'center', className: 'w-[9%]' },
      { key: 'status', label: 'Status', align: 'center', className: 'w-[10%]' },
      { key: 'actions', label: 'Actions', align: 'center', className: 'w-[10%]' }
    ],
    []
  );

  const rows = useMemo(
    () =>
      addOns.map((addOn) => ({
        ...addOn,
        status: addOn.is_active
      })),
    [addOns]
  );

  const filteredAddOns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredByStatus = rows.filter((addOn) => {
      if (statusFilter === 'all') return true;
      return statusFilter === 'active' ? addOn.is_active : !addOn.is_active;
    });

    if (!normalizedQuery) return filteredByStatus;

    return filteredByStatus.filter((addOn) =>
      Object.values(addOn).some((value) =>
        value ? value.toString().toLowerCase().includes(normalizedQuery) : false
      )
    );
  }, [rows, query, statusFilter]);

  const openCreateModal = () => {
    setAddOnModalMode('create');
    setEditingAddOn(null);
    setAddOnForm(emptyAddOnForm);
    setAddOnModalError('');
    setAddOnModalOpen(true);
  };

  const openEditModal = (addOn) => {
    setAddOnModalMode('edit');
    setEditingAddOn(addOn);
    setAddOnForm(normalizeAddOnForm(addOn));
    setAddOnModalError('');
    setAddOnModalOpen(true);
  };

  const updateAddOnField = (field, value) => {
    setAddOnForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddOnForm = () => {
    const name = addOnForm.name.trim();
    const description = addOnForm.description.trim();
    const price = addOnForm.price;
    const discount = addOnForm.discount;
    const duration = addOnForm.duration_mins;

    if (!name) return 'Name is required.';
    if (name.length > 20) return 'Name cannot be more than 20 characters.';
    if (!description) return 'Description is required.';
    if (countWords(description) > 50) return 'Description cannot be more than 50 words.';
    if (price === '' || price === null || Number.isNaN(Number(price))) return 'Price is required.';
    if (discount === '' || discount === null || Number.isNaN(Number(discount))) return 'Discount is required.';
    if (duration !== '' && duration !== null && Number.isNaN(Number(duration))) {
      return 'Duration must be a valid number.';
    }
    return '';
  };

  const submitAddOn = async () => {
    const validationError = validateAddOnForm();
    if (validationError) {
      setAddOnModalError(validationError);
      return;
    }

    setAddOnModalError('');
    setAddOnModalLoading(true);

    const payload = {
      name: addOnForm.name.trim(),
      description: addOnForm.description.trim(),
      price: Number(Number(addOnForm.price || 0).toFixed(2)),
      discount: Number(Number(addOnForm.discount || 0).toFixed(2)),
      duration_mins:
        addOnForm.duration_mins === '' || addOnForm.duration_mins === null
          ? null
          : Number(addOnForm.duration_mins),
      is_active: addOnForm.is_active === 'true'
    };

    try {
      if (addOnModalMode === 'edit') {
        await apiPatch('/add_ons/update', { ...payload, id: editingAddOn?.id }, { auth: true });
        setFlashSuccess('Add-on updated successfully.');
      } else {
        await apiPost('/add_ons/create', payload, { auth: true });
        setFlashSuccess('Add-on created successfully.');
      }

      setAddOnModalOpen(false);
      setEditingAddOn(null);
      setAddOnForm(emptyAddOnForm);
      await loadAddOns({ force: true });
    } catch (err) {
      setAddOnModalOpen(false);
      setEditingAddOn(null);
      setAddOnForm(emptyAddOnForm);
      setAddOnModalError('');
      setFlashError(err?.message || 'Unable to save add-on right now.');
    } finally {
      setAddOnModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Ons"
        subtitle="Manage your add-on catalog, pricing, and availability."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAddOns({ force: true })}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              New
            </button>
          </div>
        }
      />

      <FloatingMessage message={flashError} type="error" onClose={() => setFlashError('')} />
      <FloatingMessage message={flashSuccess} type="success" onClose={() => setFlashSuccess('')} />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 shadow-soft">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-black/50 px-3">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search add-ons"
            className="h-full w-full bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="relative flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-gray-300">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="appearance-none bg-transparent pr-6 text-sm font-medium text-white focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Showing <span className="font-semibold text-white">{filteredAddOns.length}</span> add-ons
          </span>
          {lastUpdated ? <span>Updated {formatDateTime(lastUpdated)}</span> : null}
        </div>

        <Table
          columns={columns}
          rows={filteredAddOns}
          rowKey={(row, index) => row.id || row.service_id || row.name || index}
          tableClassName="table-fixed"
          renderCell={(row, key) => {
            if (key === 'name' || key === 'description') return toTitleCase(row[key] || '');
            if (key === 'price') return formatCurrency(row.price);
            if (key === 'discount') return formatPercent(row.discount);
            if (key === 'duration') return row.duration_mins ?? row.duration ?? '—';
            if (key === 'status') {
              return (
                <span
                  className={[
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                    row.is_active
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                  ].join(' ')}
                >
                  {row.is_active ? 'Active' : 'Inactive'}
                </span>
              );
            }
            if (key === 'actions') {
              return (
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(row)}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                  >
                    Edit
                  </button>
                </div>
              );
            }
            return row[key] || '—';
          }}
          emptyMessage={loading ? 'Loading add-ons...' : 'No add-ons found.'}
        />
      </section>

      <AddOnModal
        open={addOnModalOpen}
        mode={addOnModalMode}
        form={addOnForm}
        loading={addOnModalLoading}
        error={addOnModalError}
        onClose={() => {
          setAddOnModalOpen(false);
          setEditingAddOn(null);
          setAddOnModalError('');
        }}
        onChange={updateAddOnField}
        onSubmit={submitAddOn}
      />
    </div>
  );
};

export default AddOns;
