import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faBarChart, faEye } from '@fortawesome/free-solid-svg-icons';
import type { TrackerField, TrackerKPI, TrackerChart } from '../../types/models';

interface VisualizationBuilderProps {
  customFields: TrackerField[];
  kpiCards: TrackerKPI[];
  charts: TrackerChart[];
  onKPICardsChange: (kpiCards: TrackerKPI[]) => void;
  onChartsChange: (charts: TrackerChart[]) => void;
}

export default function VisualizationBuilder({
  customFields,
  kpiCards,
  charts,
  onKPICardsChange,
  onChartsChange
}: VisualizationBuilderProps) {
  const [activeTab, setActiveTab] = useState<'kpi' | 'charts'>('kpi');

  // Debug: log custom fields to console
  console.log('VisualizationBuilder customFields:', customFields);
  
  // Filter fields that can be used for calculations
  // Number fields: for sum, average calculations
  // Checkbox fields: for percentage, count calculations  
  // Text/Select fields: for count calculations
  const numericFields = customFields.filter(field => 
    field.type === 'number' || field.type === 'checkbox' || field.type === 'text' || field.type === 'select'
  );
  const dateFields = customFields.filter(field => field.type === 'date');
  const allFields = customFields;
  
  console.log('Filtered numericFields:', numericFields);
  console.log('Filtered dateFields:', dateFields);

  // KPI Card functions
  const addKPICard = () => {
    const newKPI: TrackerKPI = {
      id: `kpi_${Date.now()}`,
      title: 'New KPI Card',
      fieldId: numericFields[0]?.id || '',
      calculation: 'sum',
      color: 'blue',
      format: 'number',
      order: kpiCards.length
    };
    onKPICardsChange([...kpiCards, newKPI]);
  };

  const updateKPICard = (id: string, updates: Partial<TrackerKPI>) => {
    const updatedKPIs = kpiCards.map(kpi => 
      kpi.id === id ? { ...kpi, ...updates } : kpi
    );
    onKPICardsChange(updatedKPIs);
  };

  const removeKPICard = (id: string) => {
    onKPICardsChange(kpiCards.filter(kpi => kpi.id !== id));
  };

  // Chart functions
  const addChart = () => {
    const newChart: TrackerChart = {
      id: `chart_${Date.now()}`,
      title: 'New Chart',
      type: 'bar',
      xAxisField: dateFields[0]?.id || '',
      yAxisField: numericFields[0]?.id || '',
      calculation: 'sum',
      timeGrouping: 'month',
      order: charts.length
    };
    onChartsChange([...charts, newChart]);
  };

  const updateChart = (id: string, updates: Partial<TrackerChart>) => {
    const updatedCharts = charts.map(chart => 
      chart.id === id ? { ...chart, ...updates } : chart
    );
    onChartsChange(updatedCharts);
  };

  const removeChart = (id: string) => {
    onChartsChange(charts.filter(chart => chart.id !== id));
  };

  if (!customFields.length) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          Add custom fields first to configure KPI cards and charts.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Data Visualizations</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FontAwesomeIcon icon={faEye} />
          Configure how data appears on public tracker page
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'kpi'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          KPI Cards ({kpiCards.length})
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'charts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Charts ({charts.length})
        </button>
      </div>

      {/* KPI Cards Tab */}
      {activeTab === 'kpi' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Create summary cards that display calculated values from your data
            </p>
            <button
              onClick={addKPICard}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add KPI Card
            </button>
          </div>

          {kpiCards.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <FontAwesomeIcon icon={faBarChart} className="text-3xl mb-2" />
              <p>No KPI cards configured</p>
              <p className="text-sm">Add cards to display key metrics like totals and averages</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpiCards.map((kpi) => (
                <div key={kpi.id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={kpi.title}
                        onChange={(e) => updateKPICard(kpi.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., Total Boat Strikes"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Field
                      </label>
                      <select
                        value={kpi.fieldId}
                        onChange={(e) => updateKPICard(kpi.id, { fieldId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select a field ({numericFields.length} available)</option>
                        {numericFields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name} ({field.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calculation
                      </label>
                      <select
                        value={kpi.calculation}
                        onChange={(e) => updateKPICard(kpi.id, { calculation: e.target.value as TrackerKPI['calculation'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="sum">Sum</option>
                        <option value="count">Count</option>
                        <option value="average">Average</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => removeKPICard(kpi.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color Theme
                      </label>
                      <select
                        value={kpi.color}
                        onChange={(e) => updateKPICard(kpi.id, { color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="red">Red</option>
                        <option value="yellow">Yellow</option>
                        <option value="purple">Purple</option>
                        <option value="gray">Gray</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Format
                      </label>
                      <select
                        value={kpi.format}
                        onChange={(e) => updateKPICard(kpi.id, { format: e.target.value as TrackerKPI['format'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="number">Number</option>
                        <option value="percentage">Percentage</option>
                        <option value="currency">Currency</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Create charts that visualize trends and patterns in your data
            </p>
            <button
              onClick={addChart}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Chart
            </button>
          </div>

          {charts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <FontAwesomeIcon icon={faBarChart} className="text-3xl mb-2" />
              <p>No charts configured</p>
              <p className="text-sm">Add charts to visualize data trends over time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {charts.map((chart) => (
                <div key={chart.id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chart Title
                      </label>
                      <input
                        type="text"
                        value={chart.title}
                        onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., Incidents by Month"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chart Type
                      </label>
                      <select
                        value={chart.type}
                        onChange={(e) => updateChart(chart.id, { type: e.target.value as TrackerChart['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="area">Area Chart</option>
                        <option value="pie">Pie Chart</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => removeChart(chart.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        X-Axis (Time)
                      </label>
                      <select
                        value={chart.xAxisField}
                        onChange={(e) => updateChart(chart.id, { xAxisField: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select field ({dateFields.length} date fields available)</option>
                        {dateFields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name} ({field.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Y-Axis (Values)
                      </label>
                      <select
                        value={chart.yAxisField}
                        onChange={(e) => updateChart(chart.id, { yAxisField: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select field ({numericFields.length} calculable fields available)</option>
                        {numericFields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name} ({field.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calculation
                      </label>
                      <select
                        value={chart.calculation}
                        onChange={(e) => updateChart(chart.id, { calculation: e.target.value as TrackerChart['calculation'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="sum">Sum</option>
                        <option value="count">Count</option>
                        <option value="average">Average</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Grouping
                      </label>
                      <select
                        value={chart.timeGrouping}
                        onChange={(e) => updateChart(chart.id, { timeGrouping: e.target.value as TrackerChart['timeGrouping'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="month">By Month</option>
                        <option value="quarter">By Quarter</option>
                        <option value="year">By Year</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group By Field (Optional)
                      </label>
                      <select
                        value={chart.groupByField || ''}
                        onChange={(e) => updateChart(chart.id, { groupByField: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">None</option>
                        {allFields.filter(f => f.type === 'select').map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <FontAwesomeIcon icon={faEye} className="mr-2" />
          These visualizations will appear on your public tracker page after you add incident data.
        </p>
      </div>
    </div>
  );
}