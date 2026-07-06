import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-electric-500 focus:ring-2 focus:ring-electric-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-electric-500/20";

function Label({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <Label label={label}>
      <input className={`${baseClass} ${className}`} {...props} />
    </Label>
  );
}

export function TextArea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <Label label={label}>
      <textarea className={`${baseClass} ${className}`} rows={3} {...props} />
    </Label>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <Label label={label}>
      <select className={`${baseClass} ${className}`} {...props}>
        {children}
      </select>
    </Label>
  );
}

export function Checkbox({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border-neutral-300 text-royal-600 accent-royal-600 outline-none focus:ring-2 focus:ring-electric-100 dark:border-neutral-600 dark:focus:ring-electric-500/20 ${className}`}
        {...props}
      />
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
    </label>
  );
}
