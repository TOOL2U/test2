import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { 
  runAllChecks, 
  PrelaunchCheckResults, 
  CheckResult,
  databaseChecks
} from '../utils/prelaunchChecks';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Database,
  Map,
  Navigation,
  AlertCircle,
  Link as LinkIcon,
  RefreshCw,
  Check,
  X
} from 'lucide-react';

const PrelaunchChecker: React.FC = () => {
  const { orders, getOrderById } = useOrders();
  const [results, setResults] = useState<PrelaunchCheckResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    database: true,
    googleMaps: true,
    navigation: true,
    errors: true,
    links: true
  });
  const [cleanedOrders, setCleanedOrders] = useState(orders);
  
  // Run checks
  const runChecks = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const checkResults = await runAllChecks(orders);
      setResults(checkResults);
      
      // Update cleaned orders
      const cleaned = databaseChecks.removeTestOrders(orders);
      setCleanedOrders(cleaned);
    } catch (error) {
      console.error('Error running pre-launch checks:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Get icon for check result status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Get section icon
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'googleMaps':
        return <Map className="w-5 h-5" />;
      case 'navigation':
        return <Navigation className="w-5 h-5" />;
      case 'errors':
        return <AlertCircle className="w-5 h-5" />;
      case 'links':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };
  
  // Get color class for status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };
  
  // Render check result
  const renderCheckResult = (result: CheckResult) => {
    return (
      <div className={`p-3 rounded-md border ${getStatusColorClass(result.status)} mb-2`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(result.status)}
          </div>
          <div className="ml-3">
            <p className="font-medium">{result.message}</p>
            {result.details && result.details.length > 0 && (
              <ul className="mt-1 text-sm list-disc list-inside">
                {result.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render section
  const renderSection = (title: string, section: string, results: CheckResult[]) => {
    // Count results by status
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    // Determine overall section status
    let sectionStatus = 'success';
    if (errorCount > 0) sectionStatus = 'error';
    else if (warningCount > 0) sectionStatus = 'warning';
    
    return (
      <div className="mb-6">
        <button
          onClick={() => toggleSection(section)}
          className={`w-full flex items-center justify-between p-3 rounded-md border ${getStatusColorClass(sectionStatus)}`}
        >
          <div className="flex items-center">
            <div className="mr-2">
              {getSectionIcon(section)}
            </div>
            <span className="font-bold">{title}</span>
            <div className="ml-4 flex space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                {successCount}
              </span>
              {warningCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {warningCount}
                </span>
              )}
              {errorCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <X className="w-3 h-3 mr-1" />
                  {errorCount}
                </span>
              )}
            </div>
          </div>
          {expandedSections[section] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections[section] && (
          <div className="mt-2 pl-2">
            {results.map((result, index) => (
              <div key={index} className="mb-2">
                {renderCheckResult(result)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Pre-launch Website Check</h2>
        <button
          onClick={runChecks}
          disabled={isRunning}
          className={`flex items-center px-4 py-2 rounded-md text-white font-medium ${
            isRunning ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Running Checks...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Run Checks
            </>
          )}
        </button>
      </div>
      
      {results ? (
        <div>
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-bold mb-2">Summary</h3>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-1" />
                <span className="text-green-700">{results.summary.success} passed</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-1" />
                <span className="text-yellow-700">{results.summary.warning} warnings</span>
              </div>
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-1" />
                <span className="text-red-700">{results.summary.error} errors</span>
              </div>
            </div>
            
            {/* Database cleanup summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium mb-2">Database Cleanup</h4>
              <p className="text-sm text-gray-700">
                {orders.length - cleanedOrders.length} test orders removed out of {orders.length} total orders.
              </p>
              {cleanedOrders.length > 0 && (
                <p className="text-sm text-gray-700 mt-1">
                  {cleanedOrders.length} real orders preserved.
                </p>
              )}
            </div>
          </div>
          
          {/* Detailed results by section */}
          {renderSection('Database Checks', 'database', results.database)}
          {renderSection('Google Maps Integration', 'googleMaps', results.googleMaps)}
          {renderSection('Navigation & UI', 'navigation', results.navigation)}
          {renderSection('Error Detection', 'errors', results.errors)}
          {renderSection('Links & Buttons', 'links', results.links)}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Click "Run Checks" to perform pre-launch website verification
          </p>
        </div>
      )}
    </div>
  );
};

export default PrelaunchChecker;
