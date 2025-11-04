import { useState } from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faChartLine, faPlay, faCog } from '@fortawesome/free-solid-svg-icons';
import { setupAnalytics, setupDemoData, fullAnalyticsSetup } from '../../utils/analyticsSetup';

export default function AnalyticsSetupPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInitialize = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const result = await setupAnalytics();
      if (result.success) {
        setResult({
          success: true,
          message: `Analytics initialized! Updated ${result.articlesUpdated} articles.`
        });
      } else {
        setResult({
          success: false,
          message: `Failed to initialize: ${result.error}`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDemoData = async () => {
    const confirmed = confirm(
      '⚠️ This will add random view and like counts to your articles. ' +
      'Only use this for testing purposes. Continue?'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    setResult(null);
    
    try {
      const demoResult = await setupDemoData();
      if (demoResult && demoResult.success) {
        setResult({
          success: true,
          message: `Demo data added! Updated ${demoResult.articlesUpdated} articles.`
        });
      } else {
        setResult({
          success: false,
          message: `Failed to add demo data: ${demoResult?.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSetupWithDemoData = async () => {
    const confirmed = confirm(
      '🎲 FULL SETUP WITH DEMO DATA\n\n' +
      'This will:\n' +
      '✅ Initialize analytics for all articles\n' +
      '🎲 Add random view/like counts for testing\n\n' +
      'Good for: Testing and seeing sample data\n\n' +
      'Continue with demo data?'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    setResult(null);
    
    try {
      await fullAnalyticsSetup(true); // Include demo data
      setResult({
        success: true,
        message: 'Full setup with demo data complete! Check your analytics dashboard.'
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullSetupClean = async () => {
    const confirmed = confirm(
      '🏁 FULL SETUP (CLEAN/PRODUCTION)\n\n' +
      'This will:\n' +
      '✅ Initialize analytics for all articles\n' +
      '🚫 NO demo data - starts with real 0 counts\n\n' +
      'Good for: Production use with real data\n\n' +
      'Continue with clean setup?'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    setResult(null);
    
    try {
      await fullAnalyticsSetup(false); // No demo data
      setResult({
        success: true,
        message: 'Clean analytics setup complete! Analytics will track real usage from now on.'
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-3 mb-4">
        <Icon icon={faChartLine} className="text-blue-600 text-xl" />
        <h2 className="text-xl font-semibold">Analytics Setup</h2>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <p className="text-blue-800 font-medium mb-2">📊 Choose Your Analytics Setup:</p>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>🏁 Clean Setup:</strong> Initialize analytics with 0 counts (for production)</p>
          <p><strong>🎲 Setup + Demo Data:</strong> Initialize with random counts (for testing)</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleFullSetupClean}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Icon icon={faChartLine} />
            {isLoading ? 'Setting Up...' : '🏁 Clean Setup (Production)'}
          </button>

          <button
            onClick={handleFullSetupWithDemoData}
            disabled={isLoading}
            className="bg-orange-600 text-white px-4 py-3 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Icon icon={faPlay} />
            {isLoading ? 'Setting Up...' : '🎲 Setup + Demo Data'}
          </button>
        </div>

        <div className="border-t pt-3 mt-4">
          <p className="text-sm text-gray-600 mb-3 font-medium">Advanced Options:</p>
          <div className="space-y-2">
            <button
              onClick={handleInitialize}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Icon icon={faCog} />
              {isLoading ? 'Initializing...' : 'Initialize Only (No Demo Data)'}
            </button>

            <button
              onClick={handleAddDemoData}
              disabled={isLoading}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Icon icon={faPlay} />
              {isLoading ? 'Adding Demo Data...' : 'Add Demo Data Only'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className={`mt-4 p-3 rounded-md ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="text-sm font-medium">
            {result.success ? '✅ Success!' : '❌ Error'}
          </p>
          <p className="text-sm">{result.message}</p>
          {result.success && (
            <p className="text-xs mt-2 text-green-600">
              💡 Visit your Analytics page to see the results!
            </p>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>What this does:</strong>
        </p>
        <ul className="text-xs text-gray-600 mt-1 space-y-1">
          <li>• Initializes viewCount and likeCount fields for existing articles</li>
          <li>• Enables real-time view tracking when users visit articles</li>
          <li>• Adds like buttons to articles for user engagement</li>
          <li>• Populates your analytics dashboard with data</li>
        </ul>
      </div>
    </div>
  );
}