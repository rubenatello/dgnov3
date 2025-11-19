import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SEOHead from '../components/SEOHead';

type ChartType = 'line' | 'bar';

interface BLSDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: string;
  [key: string]: string;
}

interface BLSSeries {
  seriesID: string;
  data: BLSDataPoint[];
}

interface BLSResponse {
  status?: string;
  responseTime?: number;
  message?: string[];
  Results?: {
    series?: BLSSeries[];
  };
}

interface ChartDataPoint {
  date: string;
  year: string;
  period: string;
  sortKey: string;
  [key: string]: string | number;
}

const ReportsPage: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedSeries, setSelectedSeries] = useState<string[]>(['LNS14000000']); // Default: Unemployment Rate
  const [startYear, setStartYear] = useState<string>('2020');
  const [endYear, setEndYear] = useState<string>(new Date().getFullYear().toString());
  const [seriesData, setSeriesData] = useState<{ [key: string]: { name: string; data: BLSDataPoint[] } }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from BLS API
  useEffect(() => {
    const availableSeries = {
      'LNS14000000': 'Unemployment Rate (%)',
      'CES0000000001': 'Total Nonfarm Employment (thousands)',
      'LNS11300000': 'Labor Force Participation Rate (%)',
      'CES0500000003': 'Average Hourly Earnings ($)',
      'CES0000000008': 'Average Weekly Hours'
    };

    const fetchBLSData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const seriesIds = Object.keys(availableSeries);
        const response = await fetch('https://us-central1-dgno-675a8.cloudfunctions.net/blsProxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            seriesid: seriesIds,
            startyear: "2020",
            endyear: new Date().getFullYear().toString()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BLSResponse = await response.json();
        
        if (data.status !== 'REQUEST_SUCCEEDED') {
          throw new Error(data.message?.join(', ') || 'API request failed');
        }

        // Parse the response data
        const parsed: { [key: string]: { name: string; data: BLSDataPoint[] } } = {};
        
        if (data?.Results?.series) {
          data.Results.series.forEach((series: BLSSeries) => {
            const seriesId = series.seriesID;
            const seriesName = getSeriesName(seriesId);
            parsed[seriesId] = {
              name: seriesName,
              data: series.data || []
            };
          });
        }
        
        setSeriesData(parsed);
      } catch (err) {
        console.error('Error fetching BLS data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch BLS data';
        
        // Handle CORS or network issues with helpful message
        if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
          setError('Unable to connect to BLS API. This may be due to CORS restrictions. Consider using a proxy server or backend service to fetch BLS data.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBLSData();
  }, [startYear, endYear]);

  // Get human-readable names for BLS series IDs
  function getSeriesName(seriesId: string): string {
    const nameMap: { [key: string]: string } = {
      'LNS14000000': 'Unemployment Rate (%)',
      'CES0000000001': 'Total Nonfarm Employment (thousands)',
      'LNS11300000': 'Labor Force Participation Rate (%)',
      'CES0500000003': 'Average Hourly Earnings ($)',
      'CES0000000008': 'Average Weekly Hours',
    };
    return nameMap[seriesId] || seriesId;
  }

  // Filter and format data for charts
  const chartData = useMemo(() => {
    if (selectedSeries.length === 0) return [];

    // Get all data points from selected series
    const allDataPoints = new Map<string, ChartDataPoint>();

    selectedSeries.forEach(seriesId => {
      const series = seriesData[seriesId];
      if (!series) return;

      series.data.forEach((point: BLSDataPoint) => {
        const year = parseInt(point.year);
        if (year < parseInt(startYear) || year > parseInt(endYear)) return;

        // Create a unique key for each time period
        const key = `${point.year}-${point.period}`;
        
        if (!allDataPoints.has(key)) {
          allDataPoints.set(key, {
            date: `${point.periodName} ${point.year}`,
            year: point.year,
            period: point.period,
            sortKey: `${point.year}${point.period}`
          });
        }

        const dataPoint = allDataPoints.get(key)!;
        dataPoint[seriesId] = parseFloat(point.value);
      });
    });

    // Convert to array and sort by date
    return Array.from(allDataPoints.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [seriesData, selectedSeries, startYear, endYear]);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    Object.values(seriesData).forEach(series => {
      series.data.forEach((point: BLSDataPoint) => {
        years.add(point.year);
      });
    });
    return Array.from(years).sort().reverse();
  }, [seriesData]);

  // Toggle series selection
  const toggleSeries = (seriesId: string) => {
    setSelectedSeries(prev => 
      prev.includes(seriesId)
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  // Chart colors
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="BLS Jobs Report - Economic Data & Analysis | DGNO"
        description="Interactive Bureau of Labor Statistics employment data visualization. Track unemployment rates, job growth, labor participation, wages, and economic trends over time."
        url="https://dgno.us/reports"
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BLS Jobs Report</h1>
          <p className="text-gray-600">
            Interactive visualization of Bureau of Labor Statistics employment data
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    chartType === 'line'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    chartType === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Start Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Year
              </label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* End Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Year
              </label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Data Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Points: {chartData.length}
              </label>
              <div className="text-sm text-gray-600 pt-2">
                {selectedSeries.length} series selected
              </div>
            </div>
          </div>

          {/* Series Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Data Series
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.keys(seriesData).length > 0 ? Object.keys(seriesData).map((seriesId, index) => (
                <button
                  key={seriesId}
                  onClick={() => toggleSeries(seriesId)}
                  className={`px-4 py-3 rounded-md text-left transition-all ${
                    selectedSeries.includes(seriesId)
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-900'
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm font-medium">
                      {seriesData[seriesId].name}
                    </span>
                  </div>
                </button>
              )) : (
                <div className="col-span-3 text-center text-gray-500 py-4">
                  {loading ? 'Loading data series...' : 'No data series available'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading BLS employment data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data from BLS API
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {!loading && !error && chartData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ResponsiveContainer width="100%" height={500}>
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => seriesData[value]?.name || value}
                  />
                  {selectedSeries.map((seriesId, index) => (
                    <Line
                      key={seriesId}
                      type="monotone"
                      dataKey={seriesId}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={seriesData[seriesId]?.name}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => seriesData[value]?.name || value}
                  />
                  {selectedSeries.map((seriesId, index) => (
                    <Bar
                      key={seriesId}
                      dataKey={seriesId}
                      fill={colors[index % colors.length]}
                      name={seriesData[seriesId]?.name}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : !loading && !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              {selectedSeries.length === 0
                ? 'Select at least one data series to display the chart'
                : 'No data available for the selected filters'}
            </p>
          </div>
        ) : null}

        {/* Data Source Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Data Source</h3>
              <p className="text-sm text-blue-800">
                Data provided live by the U.S. Bureau of Labor Statistics (BLS) API.{' '}
                <a
                  href="https://www.bls.gov/developers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Learn more about BLS data →
                </a>
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
