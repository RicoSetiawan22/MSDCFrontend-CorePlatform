import React from "react";

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  className?: string;
  containerClassName?: string;
  children?: React.ReactNode;
}

/**
 * Reusable Page Header Banner Bergaya MSDC (Navy Blue & Gold Diagonal Accent)
 * Sesuai desain Figma dashboard dan modul operasional.
 */
export function PageHeader({
  title,
  subtitle,
  className = "",
  containerClassName = "px-7 pt-5 pb-2",
  children,
}: PageHeaderProps) {
  const content = (
    <div
      className={`relative overflow-hidden rounded-[10px] bg-[#0A2140] px-8 py-5 shadow-[0_2px_8px_rgba(10,33,64,0.08)] ${className}`}
    >
      {/* Aksen Diagonal Kuning Emas di Sisi Kanan Sesuai Gambar Figma */}
      <div
        className="absolute inset-y-0 right-0 w-[45%] bg-[#F2A602] z-[1]"
        style={{ clipPath: "polygon(28% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      />

      {/* Teks Header & Actions */}
      <div className="relative z-[2] flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-white/85 font-normal leading-snug">
            {subtitle}
          </p>
        </div>
        {children && <div className="relative z-[2]">{children}</div>}
      </div>
    </div>
  );

  if (containerClassName) {
    return <div className={containerClassName}>{content}</div>;
  }

  return content;
}

