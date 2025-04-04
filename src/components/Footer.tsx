import React from 'react';
import { Logo } from './Logo';

interface FooterProps {
  variant?: 'default' | 'compact';
}

const Footer: React.FC<FooterProps> = ({ variant = 'default' }) => {
  return (
    <footer className="bg-gray-900 text-white py-8" id="main-footer">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <Logo variant="light" className="mx-auto mb-4" size="large" />
          <p className="opacity-75 text-sm">© 2024 Tool2U. All rights reserved.</p>
          <div className="mt-2 text-xs">
            <a href="tel:+66933880630" className="text-[#FFD700] hover:underline">+66 933 880 630</a> | 
            <a href="mailto:support@tool2u.com" className="text-[#FFD700] hover:underline ml-2">support@tool2u.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
