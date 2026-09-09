import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  isNavGroupActive,
  isNavLinkActive,
  type DashboardNavGroup,
} from '@/config/dashboardNav';

const triggerClass = (active: boolean) =>
  `inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    active
      ? 'bg-brand-100 text-brand-500'
      : 'text-muted hover:bg-brand-50 hover:text-ink'
  }`;

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
    isActive
      ? 'bg-brand-100 text-brand-500'
      : 'text-muted hover:bg-brand-50 hover:text-ink'
  }`;

type NavDropdownProps = {
  group: DashboardNavGroup;
  label: ReactNode;
  getChildLabel: (labelKey: string) => string;
};

export function NavDropdown({ group, label, getChildLabel }: NavDropdownProps) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const groupActive = isNavGroupActive(pathname, group);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={triggerClass(groupActive || open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full left-0 z-50 mt-2 min-w-56 rounded-2xl border border-line/80 bg-panel p-2 shadow-lg shadow-black/20"
        >
          {group.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              end={child.end}
              role="menuitem"
              className={() =>
                itemClass({ isActive: isNavLinkActive(pathname, child) })
              }
              onClick={() => setOpen(false)}
            >
              {getChildLabel(child.labelKey)}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
