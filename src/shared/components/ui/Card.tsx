import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "bordered";
}

export const Card: React.FC<CardProps> = ({
  className = "",
  variant = "default",
  children,
  ...props
}) => {
  const baseClasses = "rounded-xl transition-all duration-200";
  const variantClasses = {
    default: "bg-white border border-slate-200/90 shadow-sm",
    subtle: "bg-slate-50/70 border border-slate-100",
    bordered: "bg-white border border-slate-300/80",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <h3
    className={`text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <p className={`text-xs text-slate-500 mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 sm:p-5 border-t border-slate-100/80 bg-slate-50/40 rounded-b-xl ${className}`} {...props}>
    {children}
  </div>
);
