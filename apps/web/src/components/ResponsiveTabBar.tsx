import { useEffect, useRef, useState } from "react";

export type ResponsiveTabItem<T extends string | number> = {
  id: T;
  label: string;
  disabled?: boolean;
};

export function ResponsiveTabBar<T extends string | number>({
  items,
  activeId,
  onChange,
  ariaLabel = "Điều hướng",
  className = ""
}: {
  items: ResponsiveTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const active = items.find(item => item.id === activeId) ?? items[0];

  return (
    <div className={`responsiveTabs ${className}`.trim()} ref={rootRef}>
      <div className="responsiveTabsDesktop" role="tablist" aria-label={ariaLabel}>
        {items.map(item => (
          <button
            key={String(item.id)}
            type="button"
            role="tab"
            aria-selected={item.id === activeId}
            disabled={item.disabled}
            className={item.id === activeId ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="responsiveTabsMobile">
        <button
          type="button"
          className="responsiveTabsCurrent"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <span>{active?.label ?? "Chọn"}</span><span aria-hidden="true">▾</span>
        </button>
        <button
          type="button"
          className="responsiveTabsMenuButton"
          aria-label="Mở danh sách chuyên mục"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="responsiveTabsMenu" role="menu">
          {items.map(item => (
            <button
              key={String(item.id)}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={item.id === activeId ? "active" : ""}
              onClick={() => {
                if (item.disabled) return;
                onChange(item.id);
                setOpen(false);
              }}
            >
              <span>{item.label}</span>
              {item.id === activeId && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
