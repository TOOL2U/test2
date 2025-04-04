import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Logo({ 
  variant = 'light', 
  layout = 'horizontal', 
  className = '',
  size = 'medium'
}: LogoProps) {
  // Updated logo URL to the specified image
  const logoUrl = "https://i.imgur.com/w5oKCqX.png";
  
  // Size mapping for different logo sizes
  const sizeMap = {
    small: layout === 'horizontal' ? 150 : 180,
    medium: layout === 'horizontal' ? 180 : 220,
    large: layout === 'horizontal' ? 240 : 280
  };
  
  // Get the image size based on the size prop
  const imageSize = sizeMap[size];

  return layout === 'horizontal' ? (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={logoUrl} 
        alt="Tool2U Logo" 
        width={imageSize} 
        height={imageSize / 2}
        className="object-contain"
      />
    </div>
  ) : (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img 
        src={logoUrl} 
        alt="Tool2U Logo" 
        width={imageSize} 
        height={imageSize / 2}
        className="object-contain"
      />
    </div>
  );
}
