import { useState } from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faChartLine, faPlay, faCog, faCheck, faExclamationTriangle, faRocket, faDatabase } from '@fortawesome/free-solid-svg-icons';
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
    <div className="bg-white rounded-xl border border-stone overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Icon icon={faChartLine} className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Analytics Setup</h2>
            <p className="text-sm text-inkMuted">Configure tracking for your articles</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon icon={faDatabase} className="text-blue-600 text-sm" />
            </div>
            <div>
              <p className="text-blue-800 font-medium text-sm mb-1">Choose Your Setup Mode</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>🏁 Clean Setup:</strong> Initialize with real 0 counts (production)</p>
                <p><strong>🎲 Demo Data:</strong> Add random counts for testing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleFullSetupClean}
            disabled={isLoading}
            className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon={faRocket} className="text-xl" />
              </div>
              <div className="text-left">
                <p className="font-bold">Clean Setup</p>
                <p className="text-sm text-white/80">For production use</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleFullSetupWithDemoData}
            disabled={isLoading}
            className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-600 text-white p-5 rounded-xl hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon={faPlay} className="text-xl" />
              </div>
              <div className="text-left">
                <p className="font-bold">Demo Setup</p>
                <p className="text-sm text-white/80">With sample data</p>
              </div>
            </div>
          </button>
        </div>

        {/* Advanced Options - Collapsible Style */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-inkMuted hover:text-ink transition-colors list-none">
            <Icon icon={faCog} className="group-open:rotate-90 transition-transform" />
            Advanced Options
            <div className="flex-1 h-px bg-stone ml-2" />
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleInitialize}
              disabled={isLoading}
              className="flex items-center gap-3 p-3 bg-stone/30 hover:bg-stone/50 rounded-lg text-sm font-medium text-ink disabled:opacity-50 transition-colors"
            >
              <Icon icon={faCog} className="text-inkMuted" />
              Initialize Only
            </button>

            <button
              onClick={handleAddDemoData}
              disabled={isLoading}
              className="flex items-center gap-3 p-3 bg-stone/30 hover:bg-stone/50 rounded-lg text-sm font-medium text-ink disabled:opacity-50 transition-colors"
            >
              <Icon icon={faPlay} className="text-inkMuted" />
              Add Demo Data Only
            </button>
          </div>
        </details>

        {/* Result Message */}
        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-xl ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Icon 
                icon={result.success ? faCheck : faExclamationTriangle} 
                className={result.success ? 'text-green-600' : 'text-red-600'} 
              />
            </div>
            <div>
              <p className={`font-medium text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Success!' : 'Error'}
              </p>
              <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
              {result.success && (
                <a href="/dashboard/analytics" className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-2 hover:underline">
                  View Analytics Dashboard →
                </a>
              )}
            </div>
          </div>
        )}

        {/* What This Does */}
        <div className="bg-stone/20 rounded-xl p-4">
          <p className="text-xs font-medium text-inkMuted mb-2">What this does:</p>
          <ul className="text-xs text-inkMuted space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-inkMuted" />
              Initializes viewCount and likeCount fields for existing articles
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-inkMuted" />
              Enables real-time view tracking when users visit articles
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-inkMuted" />
              Adds like buttons to articles for user engagement
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-inkMuted" />
              Populates your analytics dashboard with data
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}