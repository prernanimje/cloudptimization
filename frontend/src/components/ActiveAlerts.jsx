import React from 'react';
import { AlertTriangle, Info, XCircle, CheckCircle, Bell } from 'lucide-react';

const ActiveAlerts = ({ alerts }) => {
    // Filter only unresolved alerts to show
    const activeAlerts = alerts?.filter(a => !a.resolved_at) || [];

    if (activeAlerts.length === 0) {
        return (
            <div className="dark-card stagger-card stagger-delay-2" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '180px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
                }}>
                    <CheckCircle size={24} color="#10b981" />
                </div>
                <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '6px', fontSize: '1.05rem', fontWeight: 600 }}>System Healthy</h4>
                <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center', fontSize: '0.82rem', maxWidth: '85%' }}>
                    No active alerts for this server instance. All performance metrics and costs are within normal operating thresholds.
                </p>
            </div>
        );
    }

    const getIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return <XCircle size={20} color="#ef4444" />;
            case 'warning':
                return <AlertTriangle size={20} color="#f59e0b" />;
            default:
                return <Info size={20} color="#3b82f6" />;
        }
    };

    const getBorderColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return '#ef4444';
            case 'warning':
                return '#f59e0b';
            default:
                return '#3b82f6';
        }
    };

    const getBackground = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)';
            case 'warning':
                return 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)';
            default:
                return 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)';
        }
    };

    return (
        <div className="dark-card stagger-card stagger-delay-2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '180px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '5px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                        <Bell size={16} color="#f59e0b" />
                    </div>
                    Active System Alerts
                </h4>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444' }}></div>
                    {activeAlerts.length} {activeAlerts.length === 1 ? 'Alert' : 'Alerts'}
                </div>
            </div>

            {/* Scrollable alerts container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '6px', maxHeight: '280px' }} className="custom-scrollbar">
                {activeAlerts.map((alert) => (
                    <div
                        key={alert.id}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '12px 14px',
                            background: getBackground(alert.severity),
                            borderRadius: '8px',
                            borderLeft: `3px solid ${getBorderColor(alert.severity)}`,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'default',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ flexShrink: 0, marginTop: '2px' }}>
                            {getIcon(alert.severity)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                    {alert.alert_type?.replace(/_/g, ' ') || 'System Alert'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                {alert.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveAlerts;
