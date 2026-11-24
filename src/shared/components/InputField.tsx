import type { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function InputField({ label, hint, error, id, ...rest }: InputFieldProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={`input${error ? " input--error" : ""}`} {...rest} />
      {hint && !error && <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.3rem" }}>{hint}</div>}
      {error && <div className="input-error">{error}</div>}
    </div>
  );
}
