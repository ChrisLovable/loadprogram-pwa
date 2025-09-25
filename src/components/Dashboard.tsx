import React from 'react';

interface DashboardProps {
  loads: any[];
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ loads, onClose }) => {
  // Filter completed loads only
  const completedLoads = loads.filter(l => l.status === 'final_signed_off');
  
  if (completedLoads.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 3500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            color: '#ef4444',
            cursor: 'pointer',
          }}>×</button>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
          <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>No Completed Loads</h3>
          <p>Complete some loads to see analytics data here.</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const calculateDaysBetween = (date1: string, date2: string) => {
    if (!date1 || !date2) return null;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Metric 1: Average days from trip to invoice
  const tripToInvoiceDays = completedLoads
    .map(load => calculateDaysBetween(load.date, load.parsed_data?.invoice?.invoiceDate))
    .filter(days => days !== null);
  const avgTripToInvoice = tripToInvoiceDays.length > 0 
    ? (tripToInvoiceDays.reduce((a, b) => a + b, 0) / tripToInvoiceDays.length).toFixed(1)
    : 'N/A';

  // Metric 2: Average load value
  const loadValues = completedLoads
    .map(load => parseFloat(load.parsed_data?.total || 0))
    .filter(val => val > 0);
  const avgLoadValue = loadValues.length > 0
    ? (loadValues.reduce((a, b) => a + b, 0) / loadValues.length).toFixed(2)
    : '0';

  // Metric 3: Most profitable route
  const routeData: {[key: string]: {total: number, count: number}} = {};
  completedLoads.forEach(load => {
    const route = `${load.parsed_data?.sender || 'Unknown'} → ${load.parsed_data?.receiver || 'Unknown'}`;
    const value = parseFloat(load.parsed_data?.total || 0);
    if (value > 0) {
      if (!routeData[route]) routeData[route] = { total: 0, count: 0 };
      routeData[route].total += value;
      routeData[route].count += 1;
    }
  });
  // const topRoute = Object.entries(routeData)
  //   .map(([route, data]) => ({ route, avg: data.total / data.count, count: data.count }))
  //   .sort((a, b) => b.avg - a.avg)[0];

  // Metric 4: Driver performance
  const driverData: {[key: string]: {total: number, count: number}} = {};
  completedLoads.forEach(load => {
    const driver = load.driver_name || 'Unknown';
    const value = parseFloat(load.parsed_data?.total || 0);
    if (value > 0) {
      if (!driverData[driver]) driverData[driver] = { total: 0, count: 0 };
      driverData[driver].total += value;
      driverData[driver].count += 1;
    }
  });

  // Metric 5: Monthly trend
  const monthlyData: {[key: string]: {total: number, count: number}} = {};
  completedLoads.forEach(load => {
    const month = load.date ? new Date(load.date).toISOString().slice(0, 7) : 'Unknown';
    const value = parseFloat(load.parsed_data?.total || 0);
    if (value > 0) {
      if (!monthlyData[month]) monthlyData[month] = { total: 0, count: 0 };
      monthlyData[month].total += value;
      monthlyData[month].count += 1;
    }
  });

  // Metric 6: Average processing time (created to final)
  const processingTimes = completedLoads
    .map(load => calculateDaysBetween(load.created_at, load.updated_at))
    .filter(days => days !== null);
  const avgProcessingTime = processingTimes.length > 0
    ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(1)
    : 'N/A';

  // Metric 7: Monthly Trip to Invoice Averages
  const monthlyTripToInvoice: {[key: string]: number[]} = {};
  completedLoads.forEach(load => {
    const month = load.date ? new Date(load.date).toISOString().slice(0, 7) : 'Unknown';
    const days = calculateDaysBetween(load.date, load.parsed_data?.invoice?.invoiceDate);
    if (days !== null) {
      if (!monthlyTripToInvoice[month]) monthlyTripToInvoice[month] = [];
      monthlyTripToInvoice[month].push(days);
    }
  });

  // Calculate monthly averages
  const monthlyTripToInvoiceAverages = Object.entries(monthlyTripToInvoice)
    .map(([month, days]) => ({
      month,
      average: days.reduce((a, b) => a + b, 0) / days.length,
      count: days.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate trendline (simple linear regression)
  const calculateTrendline = (data: {month: string, average: number}[]) => {
    if (data.length < 2) return null;
    
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.average);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  const trendline = calculateTrendline(monthlyTripToInvoiceAverages);
  const trendDirection = trendline ? (trendline.slope > 0 ? '📈' : trendline.slope < 0 ? '📉' : '➡️') : '';
  const trendText = trendline ? 
    (Math.abs(trendline.slope) < 0.1 ? 'Stable' : 
     trendline.slope > 0 ? 'Increasing' : 'Decreasing') : 'No trend';

  // Metric 8: Monthly Rate per Loaded KM Averages
  const monthlyRatePerKm: {[key: string]: number[]} = {};
  completedLoads.forEach(load => {
    const month = load.date ? new Date(load.date).toISOString().slice(0, 7) : 'Unknown';
    const ratePerKm = parseFloat(load.parsed_data?.rate || 0);
    if (ratePerKm > 0) {
      if (!monthlyRatePerKm[month]) monthlyRatePerKm[month] = [];
      monthlyRatePerKm[month].push(ratePerKm);
    }
  });

  // Calculate monthly rate averages
  const monthlyRateAverages = Object.entries(monthlyRatePerKm)
    .map(([month, rates]) => ({
      month,
      average: rates.reduce((a, b) => a + b, 0) / rates.length,
      count: rates.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate rate trendline
  const rateTrendline = calculateTrendline(monthlyRateAverages);
  const rateTrendDirection = rateTrendline ? (rateTrendline.slope > 0 ? '📈' : rateTrendline.slope < 0 ? '📉' : '➡️') : '';
  const rateTrendText = rateTrendline ? 
    (Math.abs(rateTrendline.slope) < 0.1 ? 'Stable' : 
     rateTrendline.slope > 0 ? 'Increasing' : 'Decreasing') : 'No trend';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(12px)',
      zIndex: 3500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      paddingLeft: '0px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        padding: '1rem',
        maxWidth: '85vw',
        width: '90%',
        maxHeight: '95vh',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(148, 163, 184, 0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid rgba(148, 163, 184, 0.2)',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              letterSpacing: '-0.025em',
            }}>📊 Analytics</h1>
            <p style={{
              color: '#94a3b8',
              margin: '0.3rem 0 0 0',
              fontSize: '0.85rem',
            }}>{completedLoads.length} completed loads</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseOver={e => {(e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.2)';}}
            onMouseOut={e => {(e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';}}
          >×</button>
        </div>

        {/* Dashboard Content */}
        <div style={{
          maxHeight: 'calc(95vh - 120px)',
          overflowY: 'auto',
          paddingRight: '0.5rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Key Metrics Row - Mobile Friendly */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
            }}>
              {/* Metric 1: Trip to Invoice Days */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>⏱️</div>
                <h3 style={{ color: '#3b82f6', margin: '0 0 0.3rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Trip → Invoice
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.2rem' }}>
                  {avgTripToInvoice}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {avgTripToInvoice !== 'N/A' ? 'days avg' : 'No data'}
                </div>
              </div>

              {/* Metric 2: Average Load Value */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>💰</div>
                <h3 style={{ color: '#10b981', margin: '0 0 0.3rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Avg Load Value
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.2rem' }}>
                  R{avgLoadValue}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {loadValues.length} loads
                </div>
              </div>

              {/* Metric 3: Processing Time */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>⚡</div>
                <h3 style={{ color: '#f59e0b', margin: '0 0 0.3rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Processing Time
                </h3>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.2rem' }}>
                  {avgProcessingTime}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {avgProcessingTime !== 'N/A' ? 'days avg' : 'No data'}
                </div>
              </div>

              {/* Metric 4: Monthly Trip to Invoice Trend */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{trendDirection}</div>
                <h3 style={{ color: '#a855f7', margin: '0 0 0.3rem 0', fontSize: '0.9rem', fontWeight: 700 }}>
                  Monthly Trend
                </h3>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.2rem' }}>
                  {trendText}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {monthlyTripToInvoiceAverages.length} months
                </div>
              </div>
            </div>

            {/* Charts Row - Stack on Mobile */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
              gap: '1rem',
            }}>
              {/* Monthly Trend Chart */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
              }}>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  📈 Monthly Revenue
                </h3>
                <div style={{ height: '150px', display: 'flex', alignItems: 'end', gap: '4px', padding: '0.5rem 0' }}>
                  {Object.entries(monthlyData).slice(-6).map(([month, data]) => {
                    const maxValue = Math.max(...Object.values(monthlyData).map(d => d.total));
                    const height = maxValue > 0 ? (data.total / maxValue) * 120 : 15;
                    return (
                      <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          background: `linear-gradient(to top, #3b82f6, #8b5cf6)`,
                          width: '100%',
                          height: `${height}px`,
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          minHeight: '15px',
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap',
                          }}>
                            R{(data.total / 1000).toFixed(0)}k
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                          {new Date(month + '-01').toLocaleDateString('en', { month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Driver Performance */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
              }}>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  🏆 Top Drivers
                </h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {Object.entries(driverData)
                    .map(([driver, data]) => ({ driver, avg: data.total / data.count, count: data.count }))
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 8)
                    .map((item, i) => (
                      <div key={item.driver} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        marginBottom: '0.3rem',
                        background: i === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.05)',
                        borderRadius: '8px',
                        border: i === 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(148, 163, 184, 0.1)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontSize: '1.2rem' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'}
                          </div>
                          <div>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>
                              {item.driver}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              {item.count} loads
                            </div>
                          </div>
                        </div>
                        <div style={{ color: i === 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                          R{item.avg.toFixed(0)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Monthly Trip to Invoice Days Chart */}
            {monthlyTripToInvoiceAverages.length > 0 && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
              }}>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  📅 Monthly Trip to Invoice Days
                </h3>
                <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '8px', padding: '0.5rem 0', position: 'relative' }}>
                  {monthlyTripToInvoiceAverages.slice(-6).map((data) => {
                    const maxValue = Math.max(...monthlyTripToInvoiceAverages.map(d => d.average));
                    const height = maxValue > 0 ? (data.average / maxValue) * 160 : 20;
                    const barWidth = `${100 / Math.min(monthlyTripToInvoiceAverages.slice(-6).length, 6)}%`;
                    
                    return (
                      <div key={data.month} style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: barWidth,
                        minWidth: '60px'
                      }}>
                        {/* Value label above bar */}
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#e2e8f0',
                          fontWeight: 600,
                          marginBottom: '8px',
                          textAlign: 'center',
                          background: 'rgba(168, 85, 247, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(168, 85, 247, 0.3)'
                        }}>
                          {data.average.toFixed(1)}d
                        </div>
                        
                        {/* Bar */}
                        <div style={{
                          background: `linear-gradient(to top, #a855f7, #ec4899)`,
                          width: '80%',
                          height: `${height}px`,
                          borderRadius: '6px 6px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          minHeight: '20px',
                          boxShadow: '0 4px 8px rgba(168, 85, 247, 0.3)',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 12px rgba(168, 85, 247, 0.5)';
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(168, 85, 247, 0.3)';
                        }}>
                          {/* Bar highlight */}
                          <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            right: '0',
                            height: '30%',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
                            borderRadius: '6px 6px 0 0',
                          }} />
                        </div>
                        
                        {/* Month label */}
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#94a3b8', 
                          textAlign: 'center',
                          fontWeight: 500,
                          marginBottom: '2px'
                        }}>
                          {new Date(data.month + '-01').toLocaleDateString('en', { month: 'short' })}
                        </div>
                        
                        {/* Load count */}
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: '#64748b', 
                          textAlign: 'center',
                          background: 'rgba(100, 116, 139, 0.1)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          border: '1px solid rgba(100, 116, 139, 0.2)'
                        }}>
                          {data.count} loads
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Trendline overlay */}
                  {trendline && monthlyTripToInvoiceAverages.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '2rem',
                      left: '0.5rem',
                      right: '0.5rem',
                      height: '160px',
                      pointerEvents: 'none',
                    }}>
                      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <line
                          x1="0"
                          y1={`${160 - (trendline.intercept / Math.max(...monthlyTripToInvoiceAverages.map(d => d.average))) * 160}`}
                          x2="100%"
                          y2={`${160 - ((trendline.intercept + trendline.slope * (monthlyTripToInvoiceAverages.length - 1)) / Math.max(...monthlyTripToInvoiceAverages.map(d => d.average))) * 160}`}
                          stroke="#a855f7"
                          strokeWidth="3"
                          strokeDasharray="6,4"
                          opacity="0.9"
                        />
                        {/* Trendline points */}
                        {monthlyTripToInvoiceAverages.slice(-6).map((data, i) => {
                          const y = 160 - (data.average / Math.max(...monthlyTripToInvoiceAverages.map(d => d.average))) * 160;
                          const x = (i / (monthlyTripToInvoiceAverages.slice(-6).length - 1)) * 100;
                          return (
                            <circle
                              key={`trend-${i}`}
                              cx={`${x}%`}
                              cy={y}
                              r="4"
                              fill="#a855f7"
                              stroke="#ffffff"
                              strokeWidth="2"
                              opacity="0.9"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Chart footer */}
                <div style={{ 
                  marginTop: '1rem', 
                  textAlign: 'center', 
                  color: '#94a3b8', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1rem' }}>{trendDirection}</div>
                    <span>{trendText} trend</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {monthlyTripToInvoiceAverages.length} months analyzed
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Rate per Loaded KM Chart */}
            {monthlyRateAverages.length > 0 && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '1rem',
              }}>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  💰 Monthly Rate per Loaded KM
                </h3>
                <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '8px', padding: '0.5rem 0', position: 'relative' }}>
                  {monthlyRateAverages.slice(-6).map((data) => {
                    const maxValue = Math.max(...monthlyRateAverages.map(d => d.average));
                    const height = maxValue > 0 ? (data.average / maxValue) * 160 : 20;
                    const barWidth = `${100 / Math.min(monthlyRateAverages.slice(-6).length, 6)}%`;
                    
                    return (
                      <div key={data.month} style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: barWidth,
                        minWidth: '60px'
                      }}>
                        {/* Value label above bar */}
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#e2e8f0',
                          fontWeight: 600,
                          marginBottom: '8px',
                          textAlign: 'center',
                          background: 'rgba(16, 185, 129, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          R{data.average.toFixed(0)}
                        </div>
                        
                        {/* Bar */}
                        <div style={{
                          background: `linear-gradient(to top, #10b981, #06b6d4)`,
                          width: '80%',
                          height: `${height}px`,
                          borderRadius: '6px 6px 0 0',
                          marginBottom: '8px',
                          position: 'relative',
                          minHeight: '20px',
                          boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.5)';
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                        }}>
                          {/* Bar highlight */}
                          <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            right: '0',
                            height: '30%',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
                            borderRadius: '6px 6px 0 0',
                          }} />
                        </div>
                        
                        {/* Month label */}
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#94a3b8', 
                          textAlign: 'center',
                          fontWeight: 500,
                          marginBottom: '2px'
                        }}>
                          {new Date(data.month + '-01').toLocaleDateString('en', { month: 'short' })}
                        </div>
                        
                        {/* Load count */}
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: '#64748b', 
                          textAlign: 'center',
                          background: 'rgba(100, 116, 139, 0.1)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          border: '1px solid rgba(100, 116, 139, 0.2)'
                        }}>
                          {data.count} loads
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Rate trendline overlay */}
                  {rateTrendline && monthlyRateAverages.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '2rem',
                      left: '0.5rem',
                      right: '0.5rem',
                      height: '160px',
                      pointerEvents: 'none',
                    }}>
                      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <line
                          x1="0"
                          y1={`${160 - (rateTrendline.intercept / Math.max(...monthlyRateAverages.map(d => d.average))) * 160}`}
                          x2="100%"
                          y2={`${160 - ((rateTrendline.intercept + rateTrendline.slope * (monthlyRateAverages.length - 1)) / Math.max(...monthlyRateAverages.map(d => d.average))) * 160}`}
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray="6,4"
                          opacity="0.9"
                        />
                        {/* Rate trendline points */}
                        {monthlyRateAverages.slice(-6).map((data, i) => {
                          const y = 160 - (data.average / Math.max(...monthlyRateAverages.map(d => d.average))) * 160;
                          const x = (i / (monthlyRateAverages.slice(-6).length - 1)) * 100;
                          return (
                            <circle
                              key={`rate-trend-${i}`}
                              cx={`${x}%`}
                              cy={y}
                              r="4"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="2"
                              opacity="0.9"
                            />
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Rate chart footer */}
                <div style={{ 
                  marginTop: '1rem', 
                  textAlign: 'center', 
                  color: '#94a3b8', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1rem' }}>{rateTrendDirection}</div>
                    <span>{rateTrendText} trend</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {monthlyRateAverages.length} months analyzed
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '16px',
              padding: '1rem',
            }}>
              <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>
                📊 Summary Stats
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.75rem',
              }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', color: '#3b82f6', fontWeight: 700 }}>{completedLoads.length}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', color: '#10b981', fontWeight: 700 }}>
                    R{(loadValues.reduce((a, b) => a + b, 0) / 1000).toFixed(0)}k
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Revenue</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', color: '#f59e0b', fontWeight: 700 }}>
                    {Object.keys(routeData).length}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Routes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', color: '#8b5cf6', fontWeight: 700 }}>
                    {Object.keys(driverData).length}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Drivers</div>
                </div>
              </div>
            </div>

            {/* Top Routes Table */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '16px',
              padding: '1rem',
            }}>
              <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700 }}>
                🚛 Top Routes
              </h3>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {Object.entries(routeData)
                  .map(([route, data]) => ({ route, avg: data.total / data.count, count: data.count, total: data.total }))
                  .sort((a, b) => b.avg - a.avg)
                  .slice(0, 6)
                  .map((item, i) => (
                    <div key={item.route} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                        padding: '0.5rem',
                        marginBottom: '0.3rem',
                      background: i === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.05)',
                      borderRadius: '8px',
                      border: i === 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(148, 163, 184, 0.1)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.1rem' }}>
                          {item.route.length > 35 ? item.route.substring(0, 35) + '...' : item.route}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          {item.count} loads • R{item.total.toFixed(0)} total
                        </div>
                      </div>
                      <div style={{ color: i === 0 ? '#10b981' : '#06b6d4', fontWeight: 700, fontSize: '1rem' }}>
                        R{item.avg.toFixed(0)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
