"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  label,
  placeholder = "Nhập số điện thoại",
  error,
  required,
  disabled,
  className = "",
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, "");
    onChange(digitsOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const displayError = touched ? error : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-10 border rounded-lg px-3 text-body-sm bg-background text-on-surface outline-none transition-all ${
            displayError
              ? "border-red-500 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              : "border-outline focus:ring-2 focus:ring-primary/30 focus:border-primary"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <Icon icon="material-symbols:close" className="text-sm" />
          </button>
        )}
      </div>
      {displayError && (
        <p className="text-red-500 text-body-xs flex items-center gap-1">
          <Icon icon="material-symbols:error" className="text-xs" />
          {displayError}
        </p>
      )}
    </div>
  );
}
