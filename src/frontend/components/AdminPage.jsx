import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

const AdminPage = () => {
    const [config, setConfig] = useState({
        minScore: 70,
        modelName: 'Default AI Model'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        invoke('getAppConfig').then((data) => {
            if (data) {
                setConfig(data);
            }
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load config', err);
            setLoading(false);
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

    if (loading) return <div style={{ padding: '20px' }}>Loading settings...</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ marginBottom: '24px', fontSize: '24px', color: '#172B4D' }}>AI Suggest Configuration</h1>

            {message && (
                <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'success' ? '#E3FCEF' : '#FFEBE6',
                    color: message.type === 'success' ? '#006644' : '#BF2600'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
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
                        border: '1px solid #dfe1e6',
                        width: '100%',
                        fontSize: '14px'
                    }}
                />
                <p style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                    Suggestions below this score will be filtered out (example setting).
                </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                    AI Model Identifier
                </label>
                <input
                    type="text"
                    value={config.modelName}
                    onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        width: '100%',
                        fontSize: '14px'
                    }}
                />
                <p style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                    Display name for the AI model source.
                </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
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
                            border: '1px solid #dfe1e6',
                            flexGrow: 1,
                            fontSize: '14px'
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
                            background: '#F4F5F7',
                            border: '1px solid #dfe1e6',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#42526E',
                            fontWeight: 500
                        }}
                    >
                        Test
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                    The endpoint where issue events will be sent for analysis.
                </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                    n8n API Key (Authorization Header)
                </label>
                <input
                    type="password"
                    value={config.n8nApiKey || ''}
                    onChange={(e) => setConfig({ ...config, n8nApiKey: e.target.value })}
                    placeholder="Secret API Key"
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        width: '100%',
                        fontSize: '14px'
                    }}
                />
                <p style={{ fontSize: '12px', color: '#6B778C', marginTop: '4px' }}>
                    If your n8n webhook requires a Bearer token, enter it here.
                </p>
            </div>

            {/* Advanced LLM Configuration */}
            <div style={{ marginBottom: '24px', padding: '16px', background: '#F4F5F7', borderRadius: '4px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', color: '#172B4D' }}>Advanced AI Parameters</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Temperature */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                            Temperature (0.0 - 1.0)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.temperature !== undefined ? config.temperature : 0.7}
                            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6', width: '100%', fontSize: '14px' }}
                        />
                    </div>

                    {/* Top P */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                            Top P (0.0 - 1.0)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.topP !== undefined ? config.topP : 0.9}
                            onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6', width: '100%', fontSize: '14px' }}
                        />
                    </div>

                    {/* Top K */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                            Top K (0 - 100)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={config.topK !== undefined ? config.topK : 50}
                            onChange={(e) => setConfig({ ...config, topK: parseInt(e.target.value) })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6', width: '100%', fontSize: '14px' }}
                        />
                    </div>

                    {/* Max Tokens */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#444' }}>
                            Max Tokens
                        </label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={config.maxTokens !== undefined ? config.maxTokens : 1000}
                            onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #dfe1e6', width: '100%', fontSize: '14px' }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    backgroundColor: '#0052CC',
                    color: 'white',
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
        </div>
    );
};

export default AdminPage;
