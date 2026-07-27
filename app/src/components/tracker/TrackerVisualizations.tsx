import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faChartLine, faChartPie, faCalculator } from '@fortawesome/free-solid-svg-icons';
import type { Tracker, TrackerIncident, TrackerKPI, TrackerChart } from '../../types/models';

interface TrackerVisualizationsProps {
  tracker: Tracker;
  incidents: TrackerIncident[];
  yearFilter?: number;
}

// Color palette for charts
const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
];

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function TrackerVisualizations({ tracker, incidents, yearFilter }: TrackerVisualizationsProps) {
  // Helper function to get field value from incident (supports both custom and legacy fields)
  const getFieldValue = (incident: TrackerIncident, fieldId: string) => {
    // First check custom data
    if (incident.customData?.[fieldId] !== undefined) {
      return incident.customData[fieldId];
    }
    
    // Fallback to legacy fields
    switch (fieldId) {
      case 'dateOfOccurrence':
        return incident.dateOfOccurrence?.toDate();
      case 'location':
        return incident.location;
      case 'city':
        return incident.city;
      case 'state':
        return incident.state;
      case 'description':
        return incident.description;
      case 'bodyCamAvailable':
        return incident.bodyCamAvailable;
      default:
        return undefined;
    }
  };

  // Filter and sort incidents by year if specified, always sort chronologically
  const filteredIncidents = useMemo(() => {
    let filtered = incidents;
    
    if (yearFilter) {
      filtered = incidents.filter(incident => {
        // Check for any date field (custom or legacy)
        let date: Date | null = null;
        
        // Look for custom date field first
        const dateField = tracker.customFields?.find(field => field.type === 'date');
        if (dateField) {
          const dateValue = getFieldValue(incident, dateField.id);
          if (dateValue instanceof Date) {
            date = dateValue;
          } else if (dateValue) {
            const dateStr = dateValue as string;
            // Parse YYYY-MM-DD format directly
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = dateStr.split('-').map(Number);
              date = new Date(year, month - 1, day);
            } else {
              date = new Date(dateStr + 'T12:00:00');
            }
          }
        } else {
          // Fallback to legacy date field for legacy trackers
          date = incident.dateOfOccurrence?.toDate() || null;
        }
        
        return date ? date.getFullYear() === yearFilter : false;
      });
    }
    
    // Sort chronologically (oldest to newest)
    return [...filtered].sort((a, b) => {
      const dateField = tracker.customFields?.find(field => field.type === 'date');
      
      let dateA: Date, dateB: Date;
      
        if (dateField) {
          // Use custom or legacy date field
          const dateValueA = getFieldValue(a, dateField.id);
          const dateValueB = getFieldValue(b, dateField.id);
          
          if (dateValueA instanceof Date) {
            dateA = dateValueA;
          } else if (dateValueA) {
            const dateStrA = dateValueA as string;
            // Parse YYYY-MM-DD format directly
            if (dateStrA.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [yearA, monthA, dayA] = dateStrA.split('-').map(Number);
              dateA = new Date(yearA, monthA - 1, dayA);
            } else {
              dateA = new Date(dateStrA + 'T12:00:00');
            }
          } else {
            dateA = new Date(0);
          }
          
          if (dateValueB instanceof Date) {
            dateB = dateValueB;
          } else if (dateValueB) {
            const dateStrB = dateValueB as string;
            // Parse YYYY-MM-DD format directly
            if (dateStrB.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [yearB, monthB, dayB] = dateStrB.split('-').map(Number);
              dateB = new Date(yearB, monthB - 1, dayB);
            } else {
              dateB = new Date(dateStrB + 'T12:00:00');
            }
          } else {
            dateB = new Date(0);
          }
        } else {
        // Fallback to legacy dates if no date field is found
        dateA = a.dateOfOccurrence?.toDate() || new Date(0);
        dateB = b.dateOfOccurrence?.toDate() || new Date(0);
      }
      
      return dateA.getTime() - dateB.getTime(); // Oldest first
    });
  }, [incidents, yearFilter, tracker.customFields]);

  // Calculate KPI values
  const calculateKPIValue = (kpi: TrackerKPI): string => {
    const field = tracker.customFields?.find(f => f.id === kpi.fieldId);
    if (!field) return 'Not available';

    const values = filteredIncidents
      .map(incident => getFieldValue(incident, kpi.fieldId))
      .filter(value => value !== null && value !== undefined && value !== '');

    switch (kpi.calculation) {
      case 'sum': {
        const numbers = values
          .map(toFiniteNumber)
          .filter((value): value is number => value !== null);
        if (numbers.length === 0) return 'Not available';
        const sum = numbers.reduce((acc, value) => acc + value, 0);
        return kpi.format === 'percentage' ? `${sum}%` : sum.toString();
      }

      case 'count':
        return values.length.toString();

      case 'average': {
        const numbers = values
          .map(toFiniteNumber)
          .filter((value): value is number => value !== null);
        if (numbers.length === 0) return 'Not available';
        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        return kpi.format === 'percentage' ? `${Math.round(avg)}%` : (Math.round(avg * 100) / 100).toString();
      }

      case 'percentage': {
        if (values.length === 0) return 'Not available';
        const positiveCount = field.type === 'checkbox'
          ? values.filter(val => val === true || val === 'true').length
          : values.length;
        const denominator = field.type === 'checkbox' ? values.length : filteredIncidents.length;
        if (denominator === 0) return 'Not available';
        return `${Math.round((positiveCount / denominator) * 100)}%`;
      }

      default:
        return values.length.toString();
    }
  };

  // Generate chart data
  const generateChartData = (chart: TrackerChart) => {
    const xField = tracker.customFields?.find(f => f.id === chart.xAxisField);
    const yField = tracker.customFields?.find(f => f.id === chart.yAxisField);
    
    if (!xField || !yField) return [];

    // Group data by time periods for time-based grouping
    if (chart.timeGrouping && xField.type === 'date') {
      const groups = new Map<string, number>();
      const groupCounts = new Map<string, number>();
      
      filteredIncidents.forEach(incident => {
        if (!chart.xAxisField || !chart.yAxisField) return;
        const xValue = getFieldValue(incident, chart.xAxisField);
        const yValue = getFieldValue(incident, chart.yAxisField);
        
        if (!xValue || (yValue === null || yValue === undefined)) return;
        
        // Parse date without timezone conversion
        let date: Date;
        
        if (xValue instanceof Date) {
          // Legacy date field (already a Date object)
          date = xValue;
        } else {
          // Custom date field (string format)
          const dateStr = xValue as string;
          
          // Parse YYYY-MM-DD format directly to avoid timezone issues
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            date = new Date(year, month - 1, day);
          } else {
            date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
          }
        }
        let groupKey: string;
        
        switch (chart.timeGrouping) {
          case 'month':
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            groupKey = date.getFullYear().toString();
            break;
          default:
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        
        if (chart.calculation === 'count') {
          groups.set(groupKey, (groups.get(groupKey) || 0) + 1);
        } else if (chart.calculation === 'sum' || chart.calculation === 'average') {
          const numValue = toFiniteNumber(yValue);
          if (numValue === null) return;
          groups.set(groupKey, (groups.get(groupKey) || 0) + numValue);
          if (chart.calculation === 'average') {
            groupCounts.set(groupKey, (groupCounts.get(groupKey) || 0) + 1);
          }
        }
      });
      
      return Array.from(groups.entries())
        .map(([key, total]) => ({
          name: formatGroupKey(key, chart.timeGrouping!),
          value: chart.calculation === 'average'
            ? total / (groupCounts.get(key) || 1)
            : total,
          sortKey: key // Keep original key for proper chronological sorting
        }))
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey)) // Sort by original date key
        .map(({ name, value }) => ({ name, value })); // Remove sortKey from final result
    }
    
    // Regular grouping by field values
    const groups = new Map<string, number>();
    const groupCounts = new Map<string, number>();
    
    filteredIncidents.forEach(incident => {
      if (!chart.xAxisField || !chart.yAxisField) return;
      const xValue = getFieldValue(incident, chart.xAxisField);
      const yValue = getFieldValue(incident, chart.yAxisField);
      
      if (xValue === null || xValue === undefined) return;
      
      const groupKey = String(xValue);
      
      switch (chart.calculation) {
        case 'count':
          groups.set(groupKey, (groups.get(groupKey) || 0) + 1);
          break;
        case 'sum': {
          const numValue = toFiniteNumber(yValue);
          if (numValue === null) break;
          groups.set(groupKey, (groups.get(groupKey) || 0) + numValue);
          break;
        }
        case 'average': {
          const numValue = toFiniteNumber(yValue);
          if (numValue === null) break;
          const currentData = groups.get(groupKey) || 0;
          groups.set(groupKey, currentData + numValue);
          groupCounts.set(groupKey, (groupCounts.get(groupKey) || 0) + 1);
          break;
        }
      }
    });
    
    return Array.from(groups.entries()).map(([key, total]) => ({
      name: key,
      value: chart.calculation === 'average'
        ? total / (groupCounts.get(key) || 1)
        : total
    }));
  };

  // Format group keys for display
  const formatGroupKey = (key: string, grouping: string): string => {
    switch (grouping) {
      case 'month': {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }
      case 'year':
        return key;

      default:
        return key;
    }
  };

  // Render chart component based on type
  const renderChart = (chart: TrackerChart, data: Array<{ name: string; value: number }>) => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie': {
        const pieData = data.map((item, index) => ({
          ...item,
          fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      default:
        return <div className="text-gray-500 text-center py-8">Unsupported chart type</div>;
    }
  };

  // Get chart icon
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar': return faChartBar;
      case 'line': return faChartLine;
      case 'pie': return faChartPie;
      default: return faChartBar;
    }
  };

  // Don't render if no custom fields or no configured visualizations
  if (!tracker.useCustomFields || !tracker.customFields?.length) {
    return null;
  }

  const hasKPIs = tracker.kpiCards && tracker.kpiCards.length > 0;
  const hasCharts = tracker.charts && tracker.charts.length > 0;

  if (!hasKPIs && !hasCharts) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      {hasKPIs && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalculator} />
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tracker.kpiCards!.map((kpi, index) => {
              const value = calculateKPIValue(kpi);
              return (
                <div key={index} className="bg-surface rounded-lg shadow p-4">
                  <div className={`text-2xl font-bold ${kpi.color || 'text-blue-600'}`}>
                    {value}
                  </div>
                  <div className="text-sm text-gray-600 leading-tight">
                    {kpi.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      {hasCharts && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartBar} />
            Data Visualizations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tracker.charts!.map((chart, index) => {
              const chartData = generateChartData(chart);
              return (
                <div key={index} className="bg-surface rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={getChartIcon(chart.type)} />
                    {chart.title}
                  </h3>
                  {chartData.length > 0 ? (
                    renderChart(chart, chartData)
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No data available for this visualization
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
