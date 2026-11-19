import React from 'react';

interface MonarchLogoProps {
  className?: string;
  size?: number;
  variant?: 'color' | 'gold' | 'white';
}

/**
 * Monarch Brand Crest: Two mirrored stylized lions forming a butterfly
 * silhouette topped with a geometric three-point crown.
 */
export const MonarchLogo: React.FC<MonarchLogoProps> = ({
  className = '',
  size = 28,
  variant = 'color',
}) => {
  const wingFill = variant === 'white' ? '#FFFFFF' : variant === 'gold' ? '#D4AF37' : '#102D69';
  const accentFill = variant === 'white' ? '#E2E8F0' : '#D4AF37';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Geometric Crown */}
      <path
        d="M14.5 10.5L16.5 6L20 9L23.5 6L25.5 10.5H14.5Z"
        fill={accentFill}
      />
      <rect x="14.5" y="11.5" width="11" height="1.8" rx="0.9" fill={accentFill} />

      {/* Left Mirrored Lion / Upper & Lower Butterfly Wing */}
      <path
        d="M18.8 15.2C14.8 11.4 8.2 11.2 5.4 15.1C3.7 17.5 4.4 21.1 7.2 22.8C9.8 24.4 13.7 23.6 17.2 22.4L18.8 21.8V15.2Z"
        fill={wingFill}
      />
      <path
        d="M18.6 23.4C14.8 24.4 10.2 25.1 8.5 28.4C7.3 30.8 8.9 33.8 11.9 34C15.1 34.2 17.6 31.3 18.8 27.6V23.4H18.6Z"
        fill={wingFill}
        fillOpacity="0.88"
      />
      {/* Left Lion Mane Accent */}
      <path
        d="M9.6 16.6C11.4 15.7 13.8 16.2 15.6 17.8"
        stroke={accentFill}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Right Mirrored Lion / Upper & Lower Butterfly Wing */}
      <path
        d="M21.2 15.2C25.2 11.4 31.8 11.2 34.6 15.1C36.3 17.5 35.6 21.1 32.8 22.8C30.2 24.4 26.3 23.6 22.8 22.4L21.2 21.8V15.2Z"
        fill={wingFill}
      />
      <path
        d="M21.4 23.4C25.2 24.4 29.8 25.1 31.5 28.4C32.7 30.8 31.1 33.8 28.1 34C24.9 34.2 22.4 31.3 21.2 27.6V23.4H21.4Z"
        fill={wingFill}
        fillOpacity="0.88"
      />
      {/* Right Lion Mane Accent */}
      <path
        d="M30.4 16.6C28.6 15.7 26.2 16.2 24.4 17.8"
        stroke={accentFill}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Center Spine */}
      <rect x="19.1" y="14.5" width="1.8" height="17.5" rx="0.9" fill={accentFill} />
    </svg>
  );
};
