# BLS Jobs Report Feature

## Overview
Added an interactive BLS Jobs Report page that allows users to dynamically visualize Bureau of Labor Statistics employment data with filtering and chart options.

## What Was Created

### 1. **ReportsPage Component** (`app/src/pages/ReportsPage.tsx`)
A complete, interactive data visualization page featuring:

#### Features:
- **Dual Chart Types**: Toggle between Line and Bar charts
- **Dynamic Data Series Selection**: Choose from multiple BLS metrics:
  - Unemployment Rate (%)
  - Total Nonfarm Employment (thousands)
  - Labor Force Participation Rate (%)
  - Average Hourly Earnings ($)
  - Average Weekly Hours
- **Date Range Filtering**: Select start and end years
- **Interactive Charts**: Built with Recharts library (already installed)
- **Responsive Design**: Mobile-friendly with Tailwind CSS
- **Real-time Updates**: Chart updates dynamically based on filters

#### Technical Details:
- TypeScript with proper type definitions for BLS data structure
- Uses `bls.json` from `app/src/functions/` directory
- Memoized data parsing for performance
- Color-coded series with legend
- Tooltip with detailed data on hover
- Smart data sorting by time period

### 2. **Routing Updates** (`app/src/App.tsx`)
- Added `/reports` route under the main Layout
- Reports page renders with Header, Footer, and CookieConsentBanner

### 3. **Navigation Links**
Updated both desktop and mobile navigation:
- **NavMenu.tsx**: Added "Reports" link next to "Trackers"
- **MobileHeader.tsx**: Added "Reports" link in primary navigation section
- Consistent styling with existing navigation items

### 4. **Exports** (`app/src/pages/index.ts`)
- Added ReportsPage to page exports for cleaner imports

## Data Source
The page uses the BLS JSON file at `app/src/functions/bls.json`. This file contains:
- Multiple data series from the Bureau of Labor Statistics API
- Historical employment data with monthly granularity
- Series IDs that map to human-readable metric names

## How to Use

### For Users:
1. Navigate to `/reports` or click "Reports" in the header
2. Choose between Line or Bar chart
3. Select start and end years to filter data
4. Click data series buttons to toggle them on/off
5. Hover over chart points to see detailed values

### For Developers:
To update the data, replace `app/src/functions/bls.json` with fresh BLS API data:
```bash
# Example BLS API call (requires API key)
curl https://api.bls.gov/publicAPI/v2/timeseries/data/ \
  -H "Content-Type: application/json" \
  -d '{"seriesid":["LNS14000000","CES0000000001"],"startyear":"2020","endyear":"2025","registrationkey":"YOUR_API_KEY"}'
```

To add new data series:
1. Add the series ID to the BLS API request
2. Update the `getSeriesName()` function in ReportsPage.tsx with a human-readable name

## Design Considerations

### Chart Colors
Uses a consistent color palette:
- Blue (#3b82f6)
- Green (#10b981)
- Orange (#f59e0b)
- Red (#ef4444)
- Purple (#8b5cf6)

### Performance
- Data parsing happens once with `useMemo`
- Chart data is memoized and only recalculates when filters change
- Efficient Map-based data merging for multiple series

### User Experience
- Empty state messages when no series selected
- Data point counter shows how many points are displayed
- Link to BLS developers site for transparency
- Mobile-responsive grid layouts

## Next Steps (Optional Enhancements)

1. **Live Data Integration**: Connect directly to BLS API for real-time updates
2. **Export Functionality**: Add CSV download button for filtered data
3. **Comparison Mode**: Allow comparing different time periods
4. **Custom Date Ranges**: Month-level filtering instead of just years
5. **Annotations**: Add markers for significant economic events
6. **Share Links**: Generate URLs with pre-selected filters
7. **More Series**: Add additional BLS data series (CPI, wages by sector, etc.)

## Testing Checklist

- [ ] Page loads at `/reports` without errors
- [ ] Default chart shows Unemployment Rate data
- [ ] Line/Bar toggle switches chart type
- [ ] Year filters update the data range
- [ ] Clicking series buttons toggles them on/off
- [ ] Multiple series can be displayed simultaneously
- [ ] Chart legend shows series names correctly
- [ ] Tooltips display on hover
- [ ] Mobile navigation includes Reports link
- [ ] Desktop header includes Reports link
- [ ] Page uses Layout (Header/Footer visible)
- [ ] No TypeScript errors
- [ ] Responsive on mobile devices
