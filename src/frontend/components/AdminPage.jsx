import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import ParticleSwarm from './ParticleSwarm';
import ThreeDonutChart from './ThreeDonutChart';
// Recharts removed to use 3D chart
// import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0052CC', '#36B37E', '#FFAB00', '#FF5630', '#6554C0', '#00B8D9'];

// Simple Error Boundary for the Swarm
class SwarmErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Swarm crashed:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            // Fallback UI
            return <div style={{ height: '200px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ds-text-subtlest, #6B778C)' }}>
                {/* Fallback space */}
            </div>;
        }
        return this.props.children;
    }
}

const AdminPage = () => {
    const [config, setConfig] = useState({
        minScore: 70,
        modelName: 'Default AI Model'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('settings');

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(true);

    useEffect(() => {
        // Load Config
        invoke('getAppConfig').then((data) => {
            if (data) {
                setConfig(data);
            }
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load config', err);
            setLoading(false);
        });

        // Load Report Data
        invoke('getLlmUsageStats').then(data => {
            setReportData(data);
            setLoadingReport(false);
        }).catch(err => {
            console.error("Failed to fetch report data", err);
            setLoadingReport(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await invoke('saveAppConfig', config);
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        } catch (error) {
            console.error('Failed to save config', error);
            setMessage({ type: 'error', text: 'Failed to save configuration.' });
        } finally {
            setSaving(false);
        }
    };

    // Calculate total for percentages
    const totalUsage = reportData ? Object.values(reportData).reduce((a, b) => a + b, 0) : 0;

    if (loading) return <div style={{ padding: '20px' }}>Loading settings...</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', color: 'var(--ds-text, #172B4D)' }}>

            {/* 🐝 Particle Swarm Animation with Error Protection */}
            <SwarmErrorBoundary>
                <ParticleSwarm />
            </SwarmErrorBoundary>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--ds-text, #172B4D)' }}>
                    AI Suggest Configurations and Reports <span style={{ fontSize: '12px', background: '#DEEBFF', color: '#0747A6', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' }}>v3.1 (DEV)</span>
                </h1>
            </div>

            {message && (
                <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'success' ? 'var(--ds-background-success, #E3FCEF)' : 'var(--ds-background-danger, #FFEBE6)',
                    color: message.type === 'success' ? 'var(--ds-text-success, #006644)' : 'var(--ds-text-danger, #BF2600)'
                }}>
                    {message.text}
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--ds-border, #dfe1e6)', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        padding: '10px 20px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'settings' ? '2px solid var(--ds-border-selected, #0052CC)' : '2px solid transparent',
                        marginBottom: '-2px',
                        color: activeTab === 'settings' ? 'var(--ds-text-selected, #0052CC)' : 'var(--ds-text-subtle, #5E6C84)',
                        fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Settings
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    style={{
                        padding: '10px 20px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'reports' ? '2px solid var(--ds-border-selected, #0052CC)' : '2px solid transparent',
                        marginBottom: '-2px',
                        color: activeTab === 'reports' ? 'var(--ds-text-selected, #0052CC)' : 'var(--ds-text-subtle, #5E6C84)',
                        fontWeight: activeTab === 'reports' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Reports
                </button>
            </div>

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            Minimum Confidence Threshold (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.minScore}
                            onChange={(e) => setConfig({ ...config, minScore: parseInt(e.target.value) })}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            Suggestions below this score will be filtered out (example setting).
                        </p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            AI Model Identifier
                        </label>
                        <input
                            type="text"
                            value={config.modelName}
                            onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            Display name for the AI model source.
                        </p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            N8N Webhook URL
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="url"
                                value={config.n8nUrl || ''}
                                onChange={(e) => setConfig({ ...config, n8nUrl: e.target.value })}
                                placeholder="https://your-n8n-instance.com/webhook/..."
                                style={{
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--ds-border-input, #dfe1e6)',
                                    flexGrow: 1,
                                    fontSize: '14px',
                                    backgroundColor: 'var(--ds-background-input, #ffffff)',
                                    color: 'var(--ds-text, #172B4D)'
                                }}
                            />
                            <button
                                onClick={async () => {
                                    setSaving(true);
                                    try {
                                        const res = await invoke('testN8nConnection', {
                                            url: config.n8nUrl,
                                            apiKey: config.n8nApiKey
                                        });
                                        if (res.success) {
                                            setMessage({ type: 'success', text: `Connection successful! (Status: ${res.status})` });
                                        } else {
                                            setMessage({ type: 'error', text: `Connection failed: ${res.status} ${res.statusText}` });
                                        }
                                    } catch (e) {
                                        setMessage({ type: 'error', text: `Connection error: ${e.message}` });
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving || !config.n8nUrl}
                                style={{
                                    padding: '8px 12px',
                                    background: 'var(--ds-surface-overlay, #F4F5F7)',
                                    border: '1px solid var(--ds-border, #dfe1e6)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: 'var(--ds-text, #42526E)',
                                    fontWeight: 500
                                }}
                            >
                                Test
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            The endpoint where issue events will be sent for analysis.
                        </p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            n8n API Key
                        </label>
                        <input
                            type="password"
                            value={config.n8nApiKey || ''}
                            onChange={(e) => setConfig({ ...config, n8nApiKey: e.target.value })}
                            placeholder="Secret API Key"
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            If your n8n webhook requires a Bearer token, enter it here.
                        </p>
                    </div>

                    <h3 style={{ marginTop: '30px', marginBottom: '20px', fontSize: '18px', color: 'var(--ds-text, #172B4D)', borderBottom: '1px solid var(--ds-border, #dfe1e6)', paddingBottom: '10px' }}>
                        Advanced AI Parameters
                    </h3>

                    {/* Temperature */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            Temperature
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={config.temperature !== undefined ? config.temperature : 0.7}
                            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                            placeholder="e.g. 0.7"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            Controls creativity (0.0 = deterministic, 1.0 = creative).
                        </p>
                    </div>

                    {/* Top P */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            Top P
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={config.topP !== undefined ? config.topP : 0.9}
                            onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                            placeholder="e.g. 0.9"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            Nucleus sampling probability (0.0 - 1.0).
                        </p>
                    </div>

                    {/* Top K */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            Top K
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={config.topK !== undefined ? config.topK : 50}
                            onChange={(e) => setConfig({ ...config, topK: parseFloat(e.target.value) })}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                            placeholder="e.g. 50"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            Limits the next token selection. Set to -1 to disable.
                        </p>
                    </div>

                    {/* Max Tokens */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--ds-text, #444)' }}>
                            Max Tokens
                        </label>
                        <input
                            type="number"
                            step="1"
                            value={config.maxTokens !== undefined ? config.maxTokens : 1000}
                            onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--ds-border-input, #dfe1e6)',
                                width: '100%',
                                fontSize: '14px',
                                backgroundColor: 'var(--ds-background-input, #ffffff)',
                                color: 'var(--ds-text, #172B4D)'
                            }}
                            placeholder="e.g. 1000"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--ds-text-subtlest, #6B778C)', marginTop: '4px' }}>
                            Maximum number of tokens to generate.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            backgroundColor: 'var(--ds-background-brand-bold, #0052CC)',
                            color: 'var(--ds-text-inverse, white)',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
                <>
                    <h3 style={{ marginTop: '0px', marginBottom: '20px', fontSize: '18px', color: 'var(--ds-text, #172B4D)' }}>
                        Suggestion Usage Report
                    </h3>

                    {loadingReport ? (
                        <p>Loading report data...</p>
                    ) : (
                        !reportData || Object.keys(reportData).length === 0 ? (
                            <p style={{ color: 'var(--ds-text-subtlest, #6B778C)' }}>No usage data available yet. Apply some suggestions to see data here.</p>
                        ) : (
                            <div style={{ background: 'var(--ds-surface, #fff)', borderRadius: '8px', border: '1px solid var(--ds-border, #dfe1e6)', padding: '16px' }}>
                                {/* 3D Donut Chart */}
                                <div style={{ marginBottom: '20px' }}>
                                    <ThreeDonutChart
                                        data={Object.entries(reportData).map(([name, value]) => ({ name, value }))}
                                    />
                                </div>

                                {/* Static Legend (Since Canvas is canvas) */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                                    {Object.entries(reportData).map(([name, value], index) => (
                                        <div key={name} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                                            <div style={{ width: '12px', height: '12px', background: COLORS[index % COLORS.length], borderRadius: '2px', marginRight: '6px' }}></div>
                                            <span style={{ color: 'var(--ds-text, #172B4D)' }}>{name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Count Summary */}
                                <div style={{ textAlign: 'center', marginTop: '-20px', marginBottom: '20px' }}>
                                    <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--ds-text, #172B4D)' }}>{totalUsage}</h2>
                                    <span style={{ fontSize: '14px', color: 'var(--ds-text-subtle, #5E6C84)' }}>Total Suggestions Applied</span>
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid var(--ds-border, #ebecf0)', textAlign: 'center', fontSize: '12px', color: 'var(--ds-text-subtle, #5E6C84)' }}>
                                    <p>Distribution of AI Models used for accepted suggestions.</p>
                                </div>
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPage;
