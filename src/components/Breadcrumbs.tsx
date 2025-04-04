import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  customPaths?: { path: string; label: string }[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customPaths, className = '' }) => {
  const location = useLocation();
  
  // Create breadcrumb paths from current location
  const createPathsFromLocation = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    // Start with home
    const paths = [{ path: '/', label: 'Home' }];
    
    // Add each path segment
    let currentPath = '';
    pathnames.forEach(segment => {
      currentPath += `/${segment}`;
      
      // Format the label (capitalize, replace hyphens with spaces)
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      paths.push({ path: currentPath, label });
    });
    
    return paths;
  };
  
  // Use custom paths if provided, otherwise generate from location
  const paths = customPaths || createPathsFromLocation();
  
  // Don't render if we're on the home page
  if (paths.length === 1 && paths[0].path === '/') {
    return null;
  }
  
  return (
    <nav aria-label="Breadcrumb" className={`py-3 px-4 ${className}`}>
      <ol className="flex flex-wrap items-center text-sm text-gray-600">
        {paths.map((item, index) => {
          const isLast = index === paths.length - 1;
          
          return (
            <li key={item.path} className="flex items-center">
              {index === 0 ? (
                // Home icon for first item
                <Link 
                  to={item.path} 
                  className="flex items-center text-gray-600 hover:text-[#FFD700] transition-colors"
                  aria-label="Home"
                >
                  <Home size={16} />
                </Link>
              ) : (
                <>
                  <ChevronRight size={14} className="mx-2 text-gray-400" />
                  {isLast ? (
                    // Current page (not a link)
                    <span className="font-medium text-gray-900" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    // Link to previous path
                    <Link 
                      to={item.path} 
                      className="text-gray-600 hover:text-[#FFD700] transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
