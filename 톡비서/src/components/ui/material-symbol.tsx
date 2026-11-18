import React from "react";

interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number; // default 20
  weight?: number; // 300 ~ 400
  fill?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function MaterialSymbol({
  name,
  size = 20,
  weight = 350,
  fill = false,
  className = "",
  ariaLabel,
  style,
  ...rest
}: MaterialSymbolProps) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        ...style,
      }}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      {...rest}
    >
      {name}
    </span>
  );
}

/**
 * 터치 영역 40x40px 이상을 보장하는 모바일 최적화 아이콘 버튼 래퍼
 */
export function IconButton({
  children,
  onClick,
  ariaLabel,
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full text-foreground/80 transition-colors active:scale-95 hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
