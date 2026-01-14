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
