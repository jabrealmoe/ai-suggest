import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

const StorageViewer = () => {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandingKeys, setExpandingKeys] = useState({}); // Track expanded rows

  const fetchStorage = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
        const currentCursor = reset ? undefined : cursor;
        const res = await invoke('getAllStorage', { cursor: currentCursor, limit: 10 });
        
        setItems(prev => reset ? res.results : [...prev, ...res.results]);
        setCursor(res.nextCursor);
    } catch (err) {
        console.error('Failed to fetch storage', err);
        setError('Failed to load storage data.');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage(true);
  }, []);

  const toggleExpand = (key) => {
    setExpandingKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value, key) => {
    const isExpanded = expandingKeys[key];
    let displayValue = '';
    let isObject = false;

    if (typeof value === 'object' && value !== null) {
        isObject = true;
        displayValue = JSON.stringify(value, null, 2);
    } else {
        displayValue = String(value);
    }

    const shouldTruncate = displayValue.length > 100 && !isExpanded;
    const finalValue = shouldTruncate ? displayValue.substring(0, 100) + '...' : displayValue;

    return (
        <div>
            {isObject ? <pre style={{margin: 0, whiteSpace: 'pre-wrap', fontSize: '11px', fontFamily: 'monospace'}}>{finalValue}</pre> : <span>{finalValue}</span>}
            {displayValue.length > 100 && (
                <button 
                    onClick={() => toggleExpand(key)}
                    style={{
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--ds-text-selected, #0052CC)', 
                        cursor: 'pointer', 
                        padding: 0, 
                        fontSize: '11px',
                        marginTop: '4px'
                    }}
                >
                    {isExpanded ? 'Show Less' : 'Show More'}
                </button>
            )}
        </div>
    );
  };

  return (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--ds-text, #172B4D)' }}>Storage Viewer</h3>
            <button 
                onClick={() => fetchStorage(true)} 
                disabled={loading}
                style={{
                    padding: '8px 12px',
                    background: 'var(--ds-surface-overlay, #F4F5F7)',
                    border: '1px solid var(--ds-border, #dfe1e6)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: 'var(--ds-text, #172B4D)'
                }}
            >
                Refresh
            </button>
        </div>

        {error && <div style={{ 
            padding: '12px', 
            backgroundColor: 'var(--ds-background-danger, #FFEBE6)', 
            color: 'var(--ds-text-danger, #BF2600)', 
            marginBottom: '16px',
            borderRadius: '4px'
        }}>{error}</div>}

        <div style={{ border: '1px solid var(--ds-border, #dfe1e6)', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--ds-surface-overlay, #F4F5F7)', borderBottom: '1px solid var(--ds-border, #dfe1e6)' }}>
                        <th style={{ padding: '10px', textAlign: 'left', width: '30%', color: 'var(--ds-text-subtle, #5E6C84)' }}>Key</th>
                        <th style={{ padding: '10px', textAlign: 'left', width: '50%', color: 'var(--ds-text-subtle, #5E6C84)' }}>Value</th>
                        <th style={{ padding: '10px', textAlign: 'left', width: '20%', color: 'var(--ds-text-subtle, #5E6C84)' }}>Type</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && !loading && (
                        <tr>
                            <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--ds-text-subtlest, #6B778C)' }}>
                                No storage items found.
                            </td>
                        </tr>
                    )}
                    {items.map((item) => (
                        <tr key={item.key} style={{ borderBottom: '1px solid var(--ds-border, #dfe1e6)' }}>
                            <td style={{ padding: '10px', verticalAlign: 'top', wordBreak: 'break-all', color: 'var(--ds-text, #172B4D)' }}>{item.key}</td>
                            <td style={{ padding: '10px', verticalAlign: 'top', color: 'var(--ds-text, #172B4D)' }}>
                                {renderValue(item.value, item.key)}
                            </td>
                            <td style={{ padding: '10px', verticalAlign: 'top', color: 'var(--ds-text-subtle, #5E6C84)', fontSize: '12px' }}>
                                {Array.isArray(item.value) ? 'Array' : typeof item.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ds-text-subtle, #5E6C84)' }}>Loading...</div>}

        {cursor && !loading && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button 
                    onClick={() => fetchStorage(false)}
                    style={{
                        padding: '8px 16px',
                        background: 'none',
                        border: '1px solid var(--ds-border, #dfe1e6)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--ds-text, #172B4D)'
                    }}
                >
                    Load More
                </button>
            </div>
        )}
    </div>
  );
};

export default StorageViewer;
