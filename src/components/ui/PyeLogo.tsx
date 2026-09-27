import React from 'react';

interface PyeLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
}

export const PyeLogo: React.FC<PyeLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/pye-logo.png"
        alt="PYE logo"
        width={typeof size === 'number' ? size : undefined}
        height={typeof size === 'number' ? size : undefined}
        style={{ width: size, height: size }}
        className="shrink-0 object-contain transition-transform duration-300 hover:scale-105"
      />

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <span className="text-base font-black tracking-wider text-white font-display uppercase">
            PYE
          </span>
          <span className="text-[9px] font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#FFA000]">
            Social Universe
          </span>
        </div>
      )}
    </div>
  );
};
