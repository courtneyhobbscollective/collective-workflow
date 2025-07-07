import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-6 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-12 w-auto',
  xl: 'h-16 w-auto',
};

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => (
  <svg
    className={`${sizeClasses[size]} ${className}`}
    viewBox="0 0 243.5 59.1"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="workflow by Collective logo"
    role="img"
  >
    {/* work */}
    <text
      x="1"
      y="42.7"
      fontFamily="Graphik-Bold, Graphik, sans-serif"
      fontWeight="700"
      fontSize="52.7"
      fill="currentColor"
    >
      work
    </text>
    {/* flow */}
    <text
      x="131.3"
      y="42.7"
      fontFamily="Graphik-BoldItalic, Graphik, sans-serif"
      fontWeight="700"
      fontStyle="italic"
      fontSize="52.7"
      fill="currentColor"
    >
      flow
    </text>
    {/* by Collective. */}
    <text
      x="153.3"
      y="57.7"
      fontFamily="Graphik-Regular, Graphik, sans-serif"
      fontSize="8"
      fill="currentColor"
    >
      by
      <tspan
        fontFamily="Bastia-Bold, Bastia, serif"
        fontWeight="700"
        fontSize="13.8"
        x="166.4"
        y="57.7"
      >
        Collective.
      </tspan>
    </text>
  </svg>
);

export default Logo; 