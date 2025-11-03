
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StateMapData {
  state: string;
  abbreviation: string;
  count: number;
}

interface USStateMapProps {
  data: StateMapData[];
  year?: number;
}

export default function USStateMap({ data, year }: USStateMapProps) {
  // Sort data by count for better visualization
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 15); // Top 15 states

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: StateMapData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.state}</p>
          <p className="text-blue-600">
            {data.count} incident{data.count !== 1 ? 's' : ''}
            {year && year > 0 ? ` in ${year}` : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h.01a1 1 0 100-2H5zm4 0a1 1 0 000 2h6a1 1 0 100-2H9zm0 4a1 1 0 100 2h6a1 1 0 100-2H9zm-4 0a1 1 0 100 2h.01a1 1 0 100-2H5z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-600 mb-2">No Geographic Data Available</p>
        <p className="text-sm text-gray-500">
          Add incidents with state information to see geographic distribution
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          Top States by Incident Count
          {year && year > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">({year})</span>
          )}
        </h3>
        <p className="text-sm text-gray-600">
          Showing {sortedData.length} states with incidents
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="abbreviation" 
            angle={-45}
            textAnchor="end"
            height={60}
            fontSize={12}
          />
          <YAxis fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-blue-50 p-3 rounded">
          <div className="font-semibold text-blue-800">Total States</div>
          <div className="text-blue-600">{data.length}</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="font-semibold text-green-800">Highest Count</div>
          <div className="text-green-600">{data[0]?.count || 0}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="font-semibold text-purple-800">Top State</div>
          <div className="text-purple-600">{data[0]?.abbreviation || 'N/A'}</div>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <div className="font-semibold text-orange-800">Total Incidents</div>
          <div className="text-orange-600">{data.reduce((sum, state) => sum + state.count, 0)}</div>
        </div>
      </div>
    </div>
  );
}