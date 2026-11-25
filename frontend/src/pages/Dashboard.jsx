/**
 * Main Dashboard Page - Shows metrics and recommendations for one server
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, PlayCircle, UploadCloud } from 'lucide-react';

import InfoCards from '../components/InfoCards';
import CPUChart from '../components/CPUChart';
import RAMChart from '../components/RAMChart';
import StorageChart from '../components/StorageChart';
import UptimeVisualization from '../components/UptimeChart';
import RecommendationsCard from '../components/RecommendationsCard';
import CostBreakdownPieChart from '../components/CostBreakdownPieChart';
import ActiveAlerts from '../components/ActiveAlerts';

import { analysisAPI, metricsAPI, healthAPI } from '../api';
import '../styles/DashboardStyle.css';

export const Dashboard = ({ instances = [], selectedInstance, setSelectedInstance, refreshInstances, instancesLoading = false }) => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-redirect if user has no uploaded server data
  useEffect(() => {
    if (!instancesLoading && (!instances || instances.length === 0)) {
      navigate('/app/upload', {
        state: {
          promptUpload: true,
          message: 'Please upload your server data CSV first to view the dashboard.'
        },
        replace: true
      });
    }
  }, [instancesLoading, instances, navigate]);

  // Fetch data when instance is selected
  useEffect(() => {
    if (selectedInstance) {
      loadInstanceData();
    }
  }, [selectedInstance]);

  // Real-time Dashboard Polling
  useEffect(() => {
    if (!selectedInstance) return;
    const interval = setInterval(() => {
      loadInstanceData(true);
      // We also update instances array so cost updates show in ServerSelector in App header
      if (refreshInstances) {
        refreshInstances(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedInstance, refreshInstances]);

  const loadInstanceData = async (silent = false) => {
    if (!selectedInstance) return;

    try {
      if (!silent) setLoading(true);

      // Stage data loading so charts and key cards can render as soon as possible
      const metricsPromise = metricsAPI.getMetrics(selectedInstance.id, 100);
      const alertsPromise = healthAPI.getInstanceAlerts(selectedInstance.id);
      const analysisPromise = analysisAPI.analyzeInstance(selectedInstance.id);

      // Wait only for metrics + alerts before marking the dashboard as "loaded"
      const [metricsResponse, alertsResponse] = await Promise.all([
        metricsPromise,
        alertsPromise,
      ]);

      setMetrics(metricsResponse);
      setAlerts(alertsResponse);

      // Let analysis resolve in the background so cost/AI sections fill in when ready
      analysisPromise
        .then((analysisResponse) => {
          setAnalysis(analysisResponse);
        })
        .catch((err) => {
          console.error('Failed to load analysis data:', err);
        });

      // Fire-and-forget health check; no need to block the UI
      healthAPI.checkInstanceHealth(selectedInstance.id).catch(() => {});
    } catch (err) {
      console.error('Failed to load instance data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (instancesLoading || (loading && !selectedInstance)) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div className="dark-card" style={{ maxWidth: '520px', width: '100%', padding: '40px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <UploadCloud size={32} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            No Cloud Server Data Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
            Please upload your cloud server CSV file first to generate real-time metrics, cost distribution, and AI optimization recommendations.
          </p>
          <button
            onClick={() => navigate('/app/upload', {
              state: {
                promptUpload: true,
                message: 'Please upload your server data CSV first to view the dashboard.'
              },
              replace: true
            })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            <UploadCloud size={18} />
            Go to Upload Section
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Error Message */}
      {error && (
        <div style={{ padding: '16px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #dc2626', color: '#fca5a5', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {selectedInstance && (
        <>
          {/* Main Content Layout Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '32px' }}>
            {/* Responsively handled via CSS or inline styles: normally you'd use a class, but we can do inline grid for large screens */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 13fr) minmax(0, 3fr)', gap: '32px' }}>

              {/* Left Column: CPU, RAM, Cost */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
                <div className="dark-card stagger-card stagger-delay-1" style={{ padding: '24px' }}>
                  <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px' }}>System Performance</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Inner CPU Card */}
                    <div className="monitor-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f3ff', boxShadow: '0 0 5px #00f3ff' }}></div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>CPU MONITOR</h4>
                      </div>
                      <CPUChart data={metrics} loading={loading} />
                    </div>

                    {/* Inner RAM Card */}
                    <div className="monitor-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff00f3', boxShadow: '0 0 5px #ff00f3' }}></div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>RAM MONITOR</h4>
                      </div>
                      <RAMChart data={metrics} loading={loading} />
                    </div>
                  </div>
                </div>

                {/* Cost Analysis */}
                {analysis && (
                  <div className="dark-card stagger-card stagger-delay-2">
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>Cost Analysis & Insights</h4>
                    <div className="cost-grid">
                      <div className="cost-card cost-card-blue">
                        <div className="cost-card-info">
                          <span className="cost-label" style={{ marginBottom: 0 }}>Monthly Cost</span>
                          <span className="cost-subtext" style={{ marginTop: '2px' }}>Current run rate</span>
                        </div>
                        <span className="cost-value-blue">${selectedInstance.monthly_cost.toFixed(2)}</span>
                      </div>
                      <div className="cost-card cost-card-orange">
                        <div className="cost-card-info">
                          <span className="cost-label" style={{ marginBottom: 0 }}>Wasted Resources</span>
                          <span className="cost-subtext" style={{ marginTop: '2px' }}>${analysis.monthly_waste.toFixed(2)} / month</span>
                        </div>
                        <span className="cost-value-orange">{analysis.waste_percentage.toFixed(1)}%</span>
                      </div>
                      <div className="cost-card cost-card-green">
                        <div className="cost-card-info">
                          <span className="cost-label" style={{ marginBottom: 0 }}>Potential Savings</span>
                          <span className="cost-subtext" style={{ marginTop: '2px' }}>Estimated per month</span>
                        </div>
                        <span className="cost-value-green">${analysis.recommendations.reduce((sum, r) => sum + r.savings, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Health Alerts */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <ActiveAlerts alerts={alerts} />
                </div>
              </div>

              {/* Right Column: Quick Stats */}
              <div className="stagger-card stagger-delay-3" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
                <div style={{ flex: 'none' }}>
                  <InfoCards
                    region={selectedInstance.region}
                    monthlyCost={selectedInstance.monthly_cost}
                    status={selectedInstance.status}
                    cpuUsage={selectedInstance.cpu_usage}
                    ramUsage={selectedInstance.ram_usage}
                    storageUsage={selectedInstance.storage_usage}
                  />
                </div>
                {/* Cost Breakdown Mini Graph */}
                <div className="dark-card" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <h3 className="section-title" style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.1rem' }}>Cost Breakdown Distribution</h3>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CostBreakdownPieChart
                      monthlyCost={selectedInstance.monthly_cost}
                      cpuUsage={selectedInstance.cpu_usage}
                      ramUsage={selectedInstance.ram_usage}
                      storageUsage={selectedInstance.storage_usage}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Storage and Uptime Full Width Grid */}
          <div className="stagger-card stagger-delay-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
            <div className="dark-card">
              <StorageChart
                storageUsage={selectedInstance.storage_usage}
                storageCapacity={selectedInstance.storage_capacity}
              />
            </div>
            <div className="dark-card">
              <UptimeVisualization
                uptimeHours={selectedInstance.uptime_hours}
                downtimeHours={selectedInstance.downtime_hours}
                status={selectedInstance.status}
              />
            </div>
          </div>

          {/* AI Recommendations */}
          {/* <h3 className="section-title">Smart Action Center</h3> */}
          <div className="dark-card stagger-card stagger-delay-5">
            <RecommendationsCard instance={selectedInstance} analysis={analysis} loading={loading} />
          </div>

        </>
      )}
    </div>
  );
};

export default Dashboard;
