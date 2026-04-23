const toneClasses = {
  error: 'border-red-500/45 bg-red-500/15 text-red-100',
  success: 'border-emerald-500/45 bg-emerald-500/15 text-emerald-100'
};

const FloatingMessage = ({ message, type = 'error', onClose }) => {
  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex justify-center px-4 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={[
          'toast-fade w-full max-w-2xl rounded-xl border px-5 py-3 text-sm shadow-2xl backdrop-blur-xl',
          toneClasses[type] || toneClasses.error
        ].join(' ')}
        onAnimationEnd={() => onClose?.()}
      >
        <p className="text-center">{message}</p>
      </div>
    </div>
  );
};

export default FloatingMessage;
