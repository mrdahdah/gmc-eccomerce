// apps/admin/src/components/ui.tsx
// Small shared primitives so the catalog pages stay consistent with the admin tokens
// declared in styles.css (--color-primary, --color-admin-*).
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

const inputClasses =
  'w-full rounded-md border border-admin-border bg-white px-3 py-2 text-sm text-admin-text ' +
  'transition outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-admin-text/70">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-admin-text/50">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-admin-border bg-white p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#a34f32]"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-admin-text/60">{description}</span>}
      </span>
    </label>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    ghost: 'border border-admin-border bg-white text-admin-text hover:bg-admin-card',
    danger: 'bg-danger text-white hover:bg-danger-hover',
  } as const;
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    />
  );
}

export function Banner({ tone, children }: { tone: 'success' | 'error'; children: ReactNode }) {
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
  } as const;
  return (
    <div role="status" className={`mb-4 rounded-lg border p-3 text-sm font-medium ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl rounded-xl border border-admin-border bg-admin-surface shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-admin-border p-5">
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-admin-text/60">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-admin-text/60 transition hover:bg-admin-card hover:text-admin-text"
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/** Pulls the human-readable message out of an RTK Query error payload. */
export function errorMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: { message?: string | string[] } })?.data;
  const message = data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? fallback;
}

/**
 * Horizontal scroll container for a data table.
 *
 * The admin tables need ~900px to lay out their columns; on a phone or a
 * narrow split view that used to push the whole document sideways, taking the
 * sidebar and header with it. Scrolling the table on its own keeps the page
 * itself the width of the screen.
 */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div
      // Focusable so the region is reachable (and scrollable) by keyboard.
      tabIndex={0}
      role="region"
      aria-label="Table, scrolls horizontally"
      className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0"
    >
      <div className="min-w-[820px]">{children}</div>
    </div>
  );
}
