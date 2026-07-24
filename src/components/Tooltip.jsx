import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const Tooltip = ({ content, children }) => {
  const anchorRef = useRef(null);
  const [coords, setCoords] = useState(null);

  if (!content) return children;

  const showTooltip = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2
    });
  };

  const hideTooltip = () => setCoords(null);

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="block max-w-full truncate"
      >
        {children}
      </span>
      {coords
        ? createPortal(
            <span
              role="tooltip"
              style={{ top: coords.top, left: coords.left }}
              className="pointer-events-none fixed z-50 w-max max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border border-black/10 bg-gray-100 px-3 py-2 text-left text-xs font-normal normal-case tracking-normal text-gray-900 shadow-lg shadow-black/40"
            >
              {content}
            </span>,
            document.body
          )
        : null}
    </>
  );
};

export default Tooltip;
