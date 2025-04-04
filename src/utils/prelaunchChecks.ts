/**
 * Pre-launch Checks and Optimizations Utility
 * 
 * This utility provides functions to verify website readiness before launch,
 * including database cleanup, Google Maps integration testing, navigation checks,
 * error detection, and link/button verification.
 */

import { Order } from '../context/OrderContext';

// Types for check results
export interface CheckResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

export interface PrelaunchCheckResults {
  database: CheckResult[];
  googleMaps: CheckResult[];
  navigation: CheckResult[];
  errors: CheckResult[];
  links: CheckResult[];
  summary: {
    success: number;
    warning: number;
    error: number;
    total: number;
  };
}

/**
 * Database cleanup and verification
 */
export const databaseChecks = {
  /**
   * Remove test orders from the database
   * @param orders Current orders array
   * @returns Filtered orders array with test orders removed
   */
  removeTestOrders: (orders: Order[]): Order[] => {
    // Identify test orders (those with IDs starting with 'TEST-' or containing test data)
    const filteredOrders = orders.filter(order => {
      const isTestOrder = 
        order.id.startsWith('TEST-') || 
        order.customerInfo.email.includes('test') ||
        order.customerInfo.email.includes('example.com') ||
        order.customerInfo.name.includes('Test');
      
      console.log(`Order ${order.id} is ${isTestOrder ? 'a test order' : 'a real order'}`);
      return !isTestOrder;
    });
    
    console.log(`Removed ${orders.length - filteredOrders.length} test orders`);
    return filteredOrders;
  },
  
  /**
   * Verify data integrity after cleanup
   * @param orders Orders array to verify
   * @returns Check results
   */
  verifyDataIntegrity: (orders: Order[]): CheckResult[] => {
    const results: CheckResult[] = [];
    
    // Check for missing required fields
    const ordersWithMissingFields = orders.filter(order => {
      return !order.id || 
             !order.customerInfo || 
             !order.items || 
             !order.totalAmount || 
             !order.deliveryAddress || 
             !order.status || 
             !order.paymentMethod || 
             !order.orderDate;
    });
    
    if (ordersWithMissingFields.length > 0) {
      results.push({
        status: 'error',
        message: `Found ${ordersWithMissingFields.length} orders with missing required fields`,
        details: ordersWithMissingFields.map(order => `Order ${order.id} is missing required fields`)
      });
    } else {
      results.push({
        status: 'success',
        message: 'All orders have required fields'
      });
    }
    
    // Check for invalid order statuses
    const validStatuses = ['pending', 'processing', 'payment_verification', 'on our way', 'delivered', 'completed', 'cancelled'];
    const ordersWithInvalidStatus = orders.filter(order => !validStatuses.includes(order.status));
    
    if (ordersWithInvalidStatus.length > 0) {
      results.push({
        status: 'error',
        message: `Found ${ordersWithInvalidStatus.length} orders with invalid status`,
        details: ordersWithInvalidStatus.map(order => `Order ${order.id} has invalid status: ${order.status}`)
      });
    } else {
      results.push({
        status: 'success',
        message: 'All orders have valid status'
      });
    }
    
    // Check for orders with empty items array
    const ordersWithNoItems = orders.filter(order => order.items.length === 0);
    
    if (ordersWithNoItems.length > 0) {
      results.push({
        status: 'warning',
        message: `Found ${ordersWithNoItems.length} orders with no items`,
        details: ordersWithNoItems.map(order => `Order ${order.id} has no items`)
      });
    } else {
      results.push({
        status: 'success',
        message: 'All orders have items'
      });
    }
    
    // Check for orders with invalid total amount
    const ordersWithInvalidTotal = orders.filter(order => {
      const calculatedTotal = order.items.reduce((total, item) => {
        return total + (item.price * item.quantity * (item.days || 1));
      }, 0);
      
      // Allow for small rounding differences (up to 1 unit)
      return Math.abs(calculatedTotal - order.totalAmount) > 1;
    });
    
    if (ordersWithInvalidTotal.length > 0) {
      results.push({
        status: 'warning',
        message: `Found ${ordersWithInvalidTotal.length} orders with potentially incorrect total amount`,
        details: ordersWithInvalidTotal.map(order => `Order ${order.id} has total ${order.totalAmount} but calculated total is different`)
      });
    } else {
      results.push({
        status: 'success',
        message: 'All orders have correct total amount'
      });
    }
    
    return results;
  }
};

/**
 * Google Maps integration tests
 */
export const googleMapsChecks = {
  /**
   * Test if Google Maps API is loaded
   * @returns Promise resolving to check result
   */
  testApiLoading: async (): Promise<CheckResult> => {
    return new Promise((resolve) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        resolve({
          status: 'success',
          message: 'Google Maps API is already loaded'
        });
        return;
      }
      
      // Set a timeout for API loading
      const timeout = setTimeout(() => {
        // Remove the script to avoid duplicates
        const existingScript = document.getElementById('google-maps-test-script');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
        
        resolve({
          status: 'error',
          message: 'Google Maps API failed to load within timeout period',
          details: ['Check API key and network connectivity']
        });
      }, 10000);
      
      // Create a callback function
      window.initMapTest = () => {
        clearTimeout(timeout);
        resolve({
          status: 'success',
          message: 'Google Maps API loaded successfully'
        });
      };
      
      // Create and append the script
      const script = document.createElement('script');
      script.id = 'google-maps-test-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDRDTFpVwaAjihQ1SLUuCeZLuIRhBj4seY&callback=initMapTest`;
      script.async = true;
      script.defer = true;
      
      // Handle script load error
      script.onerror = () => {
        clearTimeout(timeout);
        resolve({
          status: 'error',
          message: 'Failed to load Google Maps API script',
          details: ['Check API key and network connectivity']
        });
      };
      
      document.head.appendChild(script);
    });
  },
  
  /**
   * Test map rendering in a container
   * @returns Promise resolving to check result
   */
  testMapRendering: async (): Promise<CheckResult> => {
    return new Promise((resolve) => {
      // Create a temporary map container
      const mapContainer = document.createElement('div');
      mapContainer.id = 'test-map-container';
      mapContainer.style.width = '300px';
      mapContainer.style.height = '200px';
      mapContainer.style.position = 'absolute';
      mapContainer.style.left = '-9999px';
      document.body.appendChild(mapContainer);
      
      try {
        // Try to create a map
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API not loaded');
        }
        
        const map = new window.google.maps.Map(mapContainer, {
          center: { lat: 13.756331, lng: 100.501765 },
          zoom: 10
        });
        
        // Check if map was created successfully
        if (map && map instanceof window.google.maps.Map) {
          resolve({
            status: 'success',
            message: 'Map renders correctly'
          });
        } else {
          resolve({
            status: 'error',
            message: 'Failed to create map instance',
            details: ['Map constructor did not return a valid map object']
          });
        }
      } catch (error) {
        resolve({
          status: 'error',
          message: 'Error rendering map',
          details: [error instanceof Error ? error.message : String(error)]
        });
      } finally {
        // Clean up
        if (document.body.contains(mapContainer)) {
          document.body.removeChild(mapContainer);
        }
      }
    });
  },
  
  /**
   * Test marker creation and positioning
   * @returns Promise resolving to check result
   */
  testMarkers: async (): Promise<CheckResult> => {
    return new Promise((resolve) => {
      // Create a temporary map container
      const mapContainer = document.createElement('div');
      mapContainer.id = 'test-marker-container';
      mapContainer.style.width = '300px';
      mapContainer.style.height = '200px';
      mapContainer.style.position = 'absolute';
      mapContainer.style.left = '-9999px';
      document.body.appendChild(mapContainer);
      
      try {
        // Try to create a map and marker
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps API not loaded');
        }
        
        const map = new window.google.maps.Map(mapContainer, {
          center: { lat: 13.756331, lng: 100.501765 },
          zoom: 10
        });
        
        const marker = new window.google.maps.Marker({
          position: { lat: 13.756331, lng: 100.501765 },
          map: map,
          title: 'Test Marker'
        });
        
        // Check if marker was created successfully
        if (marker && marker instanceof window.google.maps.Marker) {
          resolve({
            status: 'success',
            message: 'Markers display correctly'
          });
        } else {
          resolve({
            status: 'error',
            message: 'Failed to create marker instance',
            details: ['Marker constructor did not return a valid marker object']
          });
        }
      } catch (error) {
        resolve({
          status: 'error',
          message: 'Error creating markers',
          details: [error instanceof Error ? error.message : String(error)]
        });
      } finally {
        // Clean up
        if (document.body.contains(mapContainer)) {
          document.body.removeChild(mapContainer);
        }
      }
    });
  },
  
  /**
   * Test geocoding functionality
   * @returns Promise resolving to check result
   */
  testGeocoding: async (): Promise<CheckResult> => {
    return new Promise((resolve) => {
      try {
        // Check if Geocoder is available
        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
          throw new Error('Google Maps Geocoder not available');
        }
        
        const geocoder = new window.google.maps.Geocoder();
        
        // Test geocoding an address
        geocoder.geocode({ address: 'Bangkok, Thailand' }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve({
              status: 'success',
              message: 'Geocoding works correctly'
            });
          } else {
            resolve({
              status: 'warning',
              message: 'Geocoding returned unexpected results',
              details: [`Status: ${status}`, `Results count: ${results ? results.length : 0}`]
            });
          }
        });
      } catch (error) {
        resolve({
          status: 'error',
          message: 'Error testing geocoding',
          details: [error instanceof Error ? error.message : String(error)]
        });
      }
    });
  },
  
  /**
   * Test map responsiveness
   * @returns Check result
   */
  testResponsiveness: (): CheckResult => {
    try {
      // Create a temporary map container
      const mapContainer = document.createElement('div');
      mapContainer.id = 'test-responsive-container';
      mapContainer.style.width = '100%';
      mapContainer.style.height = '200px';
      mapContainer.style.position = 'absolute';
      mapContainer.style.left = '-9999px';
      document.body.appendChild(mapContainer);
      
      // Check if map container responds to size changes
      const originalWidth = mapContainer.clientWidth;
      
      // Change container width
      mapContainer.style.width = '50%';
      const newWidth = mapContainer.clientWidth;
      
      // Clean up
      document.body.removeChild(mapContainer);
      
      // Check if width changed
      if (originalWidth !== newWidth) {
        return {
          status: 'success',
          message: 'Map containers respond to size changes'
        };
      } else {
        return {
          status: 'warning',
          message: 'Map container size did not change as expected',
          details: ['This may indicate issues with responsive design']
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Error testing map responsiveness',
        details: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
};

/**
 * Navigation and UI checks
 */
export const navigationChecks = {
  /**
   * Check for consistent header and footer
   * @returns Check result
   */
  checkHeaderFooter: (): CheckResult => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    
    if (!header) {
      return {
        status: 'error',
        message: 'Header element not found',
        details: ['Check if header is properly rendered across all pages']
      };
    }
    
    if (!footer) {
      return {
        status: 'warning',
        message: 'Footer element not found',
        details: ['Check if footer is properly rendered across all pages']
      };
    }
    
    return {
      status: 'success',
      message: 'Header and footer elements found'
    };
  },
  
  /**
   * Check for proper page transitions
   * @returns Check result
   */
  checkPageTransitions: (): CheckResult => {
    // Look for transition components
    const transitionElements = document.querySelectorAll('[data-transition], .page-transition, .transition');
    
    if (transitionElements.length === 0) {
      return {
        status: 'warning',
        message: 'No transition elements found',
        details: ['Page transitions may not be implemented or may use different selectors']
      };
    }
    
    // Check if any transition elements have CSS transition properties
    let hasTransitionStyles = false;
    
    transitionElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      if (styles.transition !== 'all 0s ease 0s') {
        hasTransitionStyles = true;
      }
    });
    
    if (!hasTransitionStyles) {
      return {
        status: 'warning',
        message: 'Transition elements found but may not have transition styles',
        details: ['Check CSS transitions in your stylesheets']
      };
    }
    
    return {
      status: 'success',
      message: 'Page transition elements found with proper styling'
    };
  },
  
  /**
   * Check for breadcrumb navigation
   * @returns Check result
   */
  checkBreadcrumbs: (): CheckResult => {
    // Look for breadcrumb elements
    const breadcrumbs = document.querySelectorAll('.breadcrumbs, .breadcrumb, [aria-label="breadcrumb"]');
    
    if (breadcrumbs.length === 0) {
      return {
        status: 'warning',
        message: 'No breadcrumb navigation found',
        details: ['Consider adding breadcrumbs for better navigation']
      };
    }
    
    // Check if breadcrumbs have links
    const breadcrumbLinks = Array.from(breadcrumbs).reduce((count, breadcrumb) => {
      return count + breadcrumb.querySelectorAll('a').length;
    }, 0);
    
    if (breadcrumbLinks === 0) {
      return {
        status: 'warning',
        message: 'Breadcrumbs found but contain no links',
        details: ['Check if breadcrumb links are properly rendered']
      };
    }
    
    return {
      status: 'success',
      message: 'Breadcrumb navigation found with proper links'
    };
  },
  
  /**
   * Check for mobile responsiveness
   * @returns Check result
   */
  checkResponsiveness: (): CheckResult => {
    // Check for viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      return {
        status: 'error',
        message: 'Viewport meta tag not found',
        details: ['Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the head']
      };
    }
    
    // Check for media queries in stylesheets
    let hasMediaQueries = false;
    
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const rules = document.styleSheets[i].cssRules || document.styleSheets[i].rules;
        if (!rules) continue;
        
        for (let j = 0; j < rules.length; j++) {
          if (rules[j].type === CSSRule.MEDIA_RULE) {
            hasMediaQueries = true;
            break;
          }
        }
        
        if (hasMediaQueries) break;
      } catch (e) {
        // CORS may prevent accessing rules from external stylesheets
        console.warn('Could not access rules in stylesheet', e);
      }
    }
    
    if (!hasMediaQueries) {
      return {
        status: 'warning',
        message: 'No media queries found in stylesheets',
        details: ['Check if responsive design is implemented properly']
      };
    }
    
    return {
      status: 'success',
      message: 'Responsive design elements found'
    };
  }
};

/**
 * Error detection and resolution
 */
export const errorChecks = {
  /**
   * Check for JavaScript console errors
   * @returns Promise resolving to check result
   */
  checkConsoleErrors: async (): Promise<CheckResult> => {
    return new Promise((resolve) => {
      const errors: string[] = [];
      
      // Store original console.error
      const originalConsoleError = console.error;
      
      // Override console.error to capture errors
      console.error = function(...args) {
        errors.push(args.map(arg => String(arg)).join(' '));
        originalConsoleError.apply(console, args);
      };
      
      // Wait for a short time to capture any errors
      setTimeout(() => {
        // Restore original console.error
        console.error = originalConsoleError;
        
        if (errors.length > 0) {
          resolve({
            status: 'error',
            message: `Found ${errors.length} console errors`,
            details: errors.slice(0, 10) // Limit to first 10 errors
          });
        } else {
          resolve({
            status: 'success',
            message: 'No console errors detected'
          });
        }
      }, 2000);
    });
  },
  
  /**
   * Check for unhandled promise rejections
   * @returns Promise resolving to check result
   */
  checkUnhandledRejections: async (): Promise<CheckResult> => {
    return new Promise((resolve) => {
      const rejections: string[] = [];
      
      // Set up event listener for unhandled rejections
      const rejectionHandler = (event: PromiseRejectionEvent) => {
        rejections.push(String(event.reason));
      };
      
      window.addEventListener('unhandledrejection', rejectionHandler);
      
      // Wait for a short time
      setTimeout(() => {
        // Remove event listener
        window.removeEventListener('unhandledrejection', rejectionHandler);
        
        if (rejections.length > 0) {
          resolve({
            status: 'error',
            message: `Found ${rejections.length} unhandled promise rejections`,
            details: rejections.slice(0, 10) // Limit to first 10 rejections
          });
        } else {
          resolve({
            status: 'success',
            message: 'No unhandled promise rejections detected'
          });
        }
      }, 2000);
    });
  },
  
  /**
   * Check for form validation
   * @returns Check result
   */
  checkFormValidation: (): CheckResult => {
    const forms = document.querySelectorAll('form');
    
    if (forms.length === 0) {
      return {
        status: 'warning',
        message: 'No forms found on current page',
        details: ['This check should be run on pages with forms']
      };
    }
    
    let formsWithValidation = 0;
    let formsWithoutValidation = 0;
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      let hasValidation = false;
      
      inputs.forEach(input => {
        if (input instanceof HTMLElement) {
          // Check for HTML5 validation attributes
          if (input.hasAttribute('required') || 
              input.hasAttribute('pattern') || 
              input.hasAttribute('min') || 
              input.hasAttribute('max') || 
              input.hasAttribute('minlength') || 
              input.hasAttribute('maxlength')) {
            hasValidation = true;
          }
        }
      });
      
      if (hasValidation) {
        formsWithValidation++;
      } else {
        formsWithoutValidation++;
      }
    });
    
    if (formsWithoutValidation > 0) {
      return {
        status: 'warning',
        message: `Found ${formsWithoutValidation} forms without validation attributes`,
        details: [`${formsWithValidation} forms have validation, ${formsWithoutValidation} do not`]
      };
    }
    
    return {
      status: 'success',
      message: `All ${formsWithValidation} forms have validation attributes`
    };
  },
  
  /**
   * Check for error boundaries in React components
   * @returns Check result
   */
  checkErrorBoundaries: (): CheckResult => {
    // This is a heuristic check since we can't directly inspect React component structure
    const possibleErrorBoundaries = document.querySelectorAll('[data-error-boundary], .error-boundary');
    
    if (possibleErrorBoundaries.length === 0) {
      return {
        status: 'warning',
        message: 'No visible error boundaries detected',
        details: [
          'Consider adding error boundaries to catch and handle component errors',
          'This check is heuristic and may not detect all error boundaries'
        ]
      };
    }
    
    return {
      status: 'success',
      message: `Found ${possibleErrorBoundaries.length} potential error boundaries`
    };
  }
};

/**
 * Link and button verification
 */
export const linkChecks = {
  /**
   * Check for broken internal links
   * @returns Check result
   */
  checkInternalLinks: (): CheckResult => {
    const links = document.querySelectorAll('a[href]');
    const brokenLinks: string[] = [];
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      
      if (!href) return;
      
      // Check only internal links
      if (href.startsWith('/') || href.startsWith('#') || href.startsWith('.')) {
        // Check for empty or just "#" hrefs
        if (href === '' || href === '#') {
          brokenLinks.push(`Empty link: ${link.textContent || 'No text'}`);
          return;
        }
        
        // Check for fragment identifiers
        if (href.startsWith('#')) {
          const targetId = href.substring(1);
          if (targetId && !document.getElementById(targetId)) {
            brokenLinks.push(`Broken anchor link to #${targetId}: ${link.textContent || 'No text'}`);
          }
        }
      }
    });
    
    if (brokenLinks.length > 0) {
      return {
        status: 'error',
        message: `Found ${brokenLinks.length} potentially broken internal links`,
        details: brokenLinks
      };
    }
    
    return {
      status: 'success',
      message: 'No broken internal links detected'
    };
  },
  
  /**
   * Check for buttons with proper attributes
   * @returns Check result
   */
  checkButtonAttributes: (): CheckResult => {
    const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    const issuesFound: string[] = [];
    
    buttons.forEach(button => {
      // Check if button has accessible text
      let hasAccessibleText = false;
      
      if (button instanceof HTMLElement) {
        // Check for text content
        if (button.textContent && button.textContent.trim()) {
          hasAccessibleText = true;
        }
        
        // Check for aria-label
        if (button.getAttribute('aria-label')) {
          hasAccessibleText = true;
        }
        
        // Check for aria-labelledby
        const labelledBy = button.getAttribute('aria-labelledby');
        if (labelledBy && document.getElementById(labelledBy)) {
          hasAccessibleText = true;
        }
        
        // For input buttons, check value
        if (button instanceof HTMLInputElement && button.value) {
          hasAccessibleText = true;
        }
        
        if (!hasAccessibleText) {
          issuesFound.push(`Button without accessible text: ${button.outerHTML.slice(0, 100)}`);
        }
        
        // Check if disabled buttons have aria-disabled
        if (button.hasAttribute('disabled') && !button.hasAttribute('aria-disabled')) {
          issuesFound.push(`Button with disabled attribute but no aria-disabled: ${button.outerHTML.slice(0, 100)}`);
        }
      }
    });
    
    if (issuesFound.length > 0) {
      return {
        status: 'warning',
        message: `Found ${issuesFound.length} buttons with accessibility issues`,
        details: issuesFound
      };
    }
    
    return {
      status: 'success',
      message: `All ${buttons.length} buttons have proper attributes`
    };
  },
  
  /**
   * Check for consistent button styling
   * @returns Check result
   */
  checkButtonStyling: (): CheckResult => {
    const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    
    if (buttons.length < 2) {
      return {
        status: 'success',
        message: 'Not enough buttons to check for consistent styling'
      };
    }
    
    // Extract button styles
    const buttonStyles = new Map();
    
    buttons.forEach((button, index) => {
      if (button instanceof HTMLElement) {
        const styles = window.getComputedStyle(button);
        const key = `${styles.backgroundColor}|${styles.color}|${styles.borderRadius}|${styles.padding}`;
        
        if (!buttonStyles.has(key)) {
          buttonStyles.set(key, []);
        }
        
        buttonStyles.get(key).push(index);
      }
    });
    
    // If we have too many different styles, it might indicate inconsistency
    if (buttonStyles.size > 5) {
      return {
        status: 'warning',
        message: `Found ${buttonStyles.size} different button styles`,
        details: ['Consider standardizing button styles for consistency']
      };
    }
    
    return {
      status: 'success',
      message: `Button styling is consistent (${buttonStyles.size} style variants)`
    };
  },
  
  /**
   * Check for proper hover states
   * @returns Check result
   */
  checkHoverStates: (): CheckResult => {
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input[type="button"], input[type="submit"]');
    const elementsWithoutHover: string[] = [];
    
    interactiveElements.forEach(element => {
      if (element instanceof HTMLElement) {
        const normalStyles = window.getComputedStyle(element);
        
        // Simulate hover
        element.classList.add('hover-test');
        const hoverStyles = window.getComputedStyle(element);
        element.classList.remove('hover-test');
        
        // Check if any styles change on hover
        let hasHoverEffect = false;
        
        // Check common hover properties
        const hoverProperties = ['color', 'backgroundColor', 'borderColor', 'textDecoration', 'boxShadow', 'transform'];
        
        for (const prop of hoverProperties) {
          if (normalStyles[prop as any] !== hoverStyles[prop as any]) {
            hasHoverEffect = true;
            break;
          }
        }
        
        // Check for hover in stylesheets
        if (!hasHoverEffect) {
          for (let i = 0; i < document.styleSheets.length; i++) {
            try {
              const rules = document.styleSheets[i].cssRules || document.styleSheets[i].rules;
              if (!rules) continue;
              
              for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                if (rule instanceof CSSStyleRule && 
                    rule.selectorText && 
                    rule.selectorText.includes(':hover') && 
                    element.matches(rule.selectorText.replace(':hover', ''))) {
                  hasHoverEffect = true;
                  break;
                }
              }
              
              if (hasHoverEffect) break;
            } catch (e) {
              // CORS may prevent accessing rules from external stylesheets
              console.warn('Could not access rules in stylesheet', e);
            }
          }
        }
        
        if (!hasHoverEffect && 
            (element.tagName === 'A' || 
             element.tagName === 'BUTTON' || 
             element.getAttribute('role') === 'button')) {
          elementsWithoutHover.push(`${element.tagName.toLowerCase()} ${element.textContent ? `"${element.textContent.trim().substring(0, 20)}"` : '[no text]'}`);
        }
      }
    });
    
    if (elementsWithoutHover.length > 0) {
      return {
        status: 'warning',
        message: `Found ${elementsWithoutHover.length} interactive elements without hover effects`,
        details: elementsWithoutHover.slice(0, 10) // Limit to first 10
      };
    }
    
    return {
      status: 'success',
      message: 'Interactive elements have proper hover states'
    };
  }
};

/**
 * Run all pre-launch checks
 * @param orders Current orders array
 * @returns Promise resolving to check results
 */
export const runAllChecks = async (orders: Order[]): Promise<PrelaunchCheckResults> => {
  console.log('Starting pre-launch checks...');
  
  // Database checks
  console.log('Running database checks...');
  const cleanedOrders = databaseChecks.removeTestOrders(orders);
  const databaseResults = databaseChecks.verifyDataIntegrity(cleanedOrders);
  
  // Google Maps checks
  console.log('Running Google Maps checks...');
  const mapsApiResult = await googleMapsChecks.testApiLoading();
  let mapsResults = [mapsApiResult];
  
  if (mapsApiResult.status === 'success') {
    // Only run these checks if the API loaded successfully
    mapsResults = mapsResults.concat([
      await googleMapsChecks.testMapRendering(),
      await googleMapsChecks.testMarkers(),
      await googleMapsChecks.testGeocoding(),
      googleMapsChecks.testResponsiveness()
    ]);
  }
  
  // Navigation checks
  console.log('Running navigation checks...');
  const navigationResults = [
    navigationChecks.checkHeaderFooter(),
    navigationChecks.checkPageTransitions(),
    navigationChecks.checkBreadcrumbs(),
    navigationChecks.checkResponsiveness()
  ];
  
  // Error checks
  console.log('Running error checks...');
  const errorResults = [
    await errorChecks.checkConsoleErrors(),
    await errorChecks.checkUnhandledRejections(),
    errorChecks.checkFormValidation(),
    errorChecks.checkErrorBoundaries()
  ];
  
  // Link checks
  console.log('Running link checks...');
  const linkResults = [
    linkChecks.checkInternalLinks(),
    linkChecks.checkButtonAttributes(),
    linkChecks.checkButtonStyling(),
    linkChecks.checkHoverStates()
  ];
  
  // Calculate summary
  const allResults = [...databaseResults, ...mapsResults, ...navigationResults, ...errorResults, ...linkResults];
  const summary = {
    success: allResults.filter(r => r.status === 'success').length,
    warning: allResults.filter(r => r.status === 'warning').length,
    error: allResults.filter(r => r.status === 'error').length,
    total: allResults.length
  };
  
  console.log('Pre-launch checks completed.');
  
  return {
    database: databaseResults,
    googleMaps: mapsResults,
    navigation: navigationResults,
    errors: errorResults,
    links: linkResults,
    summary
  };
};
