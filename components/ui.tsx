import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-field-600/60 bg-field-900/70 shadow-[0_0_0_1px_rgba(242,239,228,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 border-b border-field-600/60 pb-4">
      <div className="mb-3 h-1 w-14 rounded-full bg-gradient-to-r from-gold to-gold/20" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="stencil text-2xl font-bold tracking-widest text-chalk">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-chalk-faint">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const base =
    "stencil inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-bold tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-gold text-field-950 hover:bg-gold/90",
    secondary: "border border-field-500 bg-field-800 text-chalk hover:bg-field-700",
    danger: "border border-flag/60 bg-flag/10 text-flag hover:bg-flag/20",
    ghost: "text-chalk-dim hover:text-chalk",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-field-600 bg-field-950/60 px-3 py-2 text-sm text-chalk placeholder:text-chalk-faint focus:border-gold focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-field-600 bg-field-950/60 px-3 py-2 text-sm text-chalk focus:border-gold focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="stencil mb-1 block text-[11px] tracking-wider text-chalk-faint">{children}</label>;
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "good" | "bad" | "gold" }) {
  const tones: Record<string, string> = {
    default: "bg-field-700 text-chalk-dim border-field-500",
    good: "bg-field-600/40 text-chalk border-field-500/60",
    bad: "bg-flag/15 text-flag border-flag/50",
    gold: "bg-gold/15 text-gold border-gold/50",
  };
  return (
    <span className={`stencil inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-field-600 p-8 text-center text-sm text-chalk-faint">{children}</div>;
}
