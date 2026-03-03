import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";

function Settings({ data, onLogout }) {
    const [logs, setLogs] = useState('');
    const [logFiles, setLogFiles] = useState([]);
    const [selectedDate, setSelectedDate] = useState('today');
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState('');

    // Fetch logs
    const fetchLogs = async (date = 'today') => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`http://localhost:4040/api/utils/logs?date=${date}&lines=100`, {
                method: 'GET',
                headers
            });

            if (response.ok) {
                const res = await response.json();
                setLogs(res.logs);
                setLastUpdate(new Date());
            } else {
                setError('Failed to fetch logs');
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Error fetching logs: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch available log files
    const fetchLogFiles = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch('http://localhost:4040/api/utils/logs/files', {
                method: 'GET',
                headers
            });

            if (response.ok) {
                const res = await response.json();
                setLogFiles(res.files || []);
            }
        } catch (err) {
            console.error('Error fetching log files:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLogs(selectedDate);
        fetchLogFiles();
    }, [selectedDate]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchLogs(selectedDate);
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, selectedDate]);

    return (
        <>
            <Navbar data={data} onLogout={onLogout} />

            <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div>
                            <h1 className="h3 fw-bold text-dark mb-1">Settings</h1>
                            <p className="text-muted mb-0 small">System settings and monitoring</p>
                        </div>
                    </div>
                </div>

                {/* Live Logs Section */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 className="mb-1 fw-semibold">
                                        <svg width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="M8 6a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 6zm0-4a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
                                        </svg>
                                        Live System Logs
                                    </h5>
                                    <small className="text-muted">Last 100 entries {lastUpdate && `(updated ${lastUpdate.toLocaleTimeString()})`}</small>
                                </div>
                                <div className="d-flex gap-2 flex-wrap align-items-center">
                                    {autoRefresh && (
                                        <span className="badge bg-success d-flex align-items-center gap-1">
                                            <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: 'rgba(255,255,255,0.7)', animation: 'pulse 1s infinite' }}></span>
                                            Live
                                        </span>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => fetchLogs(selectedDate)}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                                    <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm6-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                                                    <path d="M8 4a.5.5 0 0 1 .5.5v3.362l2.236-1.618a.5.5 0 0 1 .894.447l-4 2.9a.5.5 0 0 1-.06.03.5.5 0 0 1-.894-.447l4-2.9a.5.5 0 0 1 .06-.03V4.5A.5.5 0 0 1 8 4z" />
                                                </svg>
                                                Refresh
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="card-body p-3">
                                {/* Controls */}
                                <div className="row g-2 mb-3">
                                    <div className="col-12 col-sm-6 col-md-3">
                                        <label className="form-label small fw-semibold">Log Date</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        >
                                            <option value="today">Today</option>
                                            {logFiles.map((file) => (
                                                <option key={file} value={file.replace('app-', '').replace('.log', '')}>
                                                    {file.replace('app-', '').replace('.log', '')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12 col-sm-6 col-md-3">
                                        <label className="form-label small fw-semibold">Auto Refresh</label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-select form-select-sm"
                                                value={autoRefresh ? refreshInterval : '0'}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (val === 0) {
                                                        setAutoRefresh(false);
                                                    } else {
                                                        setAutoRefresh(true);
                                                        setRefreshInterval(val);
                                                    }
                                                }}
                                            >
                                                <option value="0">Disabled</option>
                                                <option value="2">2s</option>
                                                <option value="5">5s</option>
                                                <option value="10">10s</option>
                                                <option value="30">30s</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold">Status</label>
                                        <div className="alert alert-info mb-0 py-2 px-3 small">
                                            <strong>Total files:</strong> {logFiles.length} |
                                            <strong className="ms-2">Current:</strong> {selectedDate} |
                                            <strong className="ms-2">Size:</strong> {(logs.length / 1024).toFixed(1)} KB
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="alert alert-danger mb-3 small" role="alert">
                                        {error}
                                    </div>
                                )}

                                {/* Logs Display */}
                                <div className="logs-container" style={{
                                    backgroundColor: '#1e1e1e',
                                    color: '#d4d4d4',
                                    fontFamily: 'Courier New, monospace',
                                    fontSize: '12px',
                                    lineHeight: '1.5',
                                    padding: '15px',
                                    borderRadius: '6px',
                                    maxHeight: '500px',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    border: '1px solid #3e3e3e'
                                }}>
                                    {logs ? (
                                        <div>
                                            {logs.split('\n').map((line, idx) => {
                                                let color = '#d4d4d4'; // default
                                                if (line.includes('[ERROR]')) color = '#f48771'; // red
                                                else if (line.includes('[WARN]')) color = '#dcdcaa'; // yellow
                                                else if (line.includes('[INFO]')) color = '#4ec9b0'; // teal
                                                else if (line.includes('[REQUEST]')) color = '#9cdcfe'; // light blue
                                                else if (line.includes('[DATA]')) color = '#6a9955'; // green

                                                return (
                                                    <div key={idx} style={{ color }}>
                                                        {line}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#6a9955' }}>No logs available</span>
                                    )}
                                </div>

                                {/* Copy Button */}
                                <div className="mt-2">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(logs);
                                            alert('Logs copied to clipboard!');
                                        }}
                                        disabled={!logs}
                                    >
                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                        </svg>
                                        Copy to Clipboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Settings Sections */}
                <div className="row">
                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom p-3">
                                <h5 className="mb-0 fw-semibold">System Information</h5>
                            </div>
                            <div className="card-body">
                                <table className="table table-sm table-borderless mb-0">
                                    <tbody>
                                        <tr>
                                            <td className="text-muted fw-semibold small" style={{ width: '40%' }}>Server</td>
                                            <td>http://localhost:4040</td>
                                        </tr>
                                        <tr>
                                            <td className="text-muted fw-semibold small">User</td>
                                            <td>{data?.nickname || 'Unknown'}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-muted fw-semibold small">Timestamp</td>
                                            <td>{new Date().toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-muted fw-semibold small">Timezone</td>
                                            <td>{Intl.DateTimeFormat().resolvedOptions().timeZone}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-6">
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-bottom p-3">
                                <h5 className="mb-0 fw-semibold">Quick Actions</h5>
                            </div>
                            <div className="card-body">
                                <button className="btn btn-sm btn-outline-primary w-100 mb-2">
                                    <svg width="14" height="14" fill="currentColor" className="me-2" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3.362l2.236-1.618a.5.5 0 0 1 .894.447l-4 2.9a.5.5 0 0 1-.06.03.5.5 0 0 1-.894-.447l4-2.9a.5.5 0 0 1 .06-.03V4.5A.5.5 0 0 1 8 4z" />
                                    </svg>
                                    Clear Old Logs
                                </button>
                                <button className="btn btn-sm btn-outline-info w-100 mb-2">
                                    <svg width="14" height="14" fill="currentColor" className="me-2" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                        <path d="M9.224 14.65a1.5 1.5 0 1 0 2.552 0 1.5 1.5 0 0 0-2.552 0zm3-4.4h-3.8V12l2.5 1.5V10.25zm-2.8 0h-3.8V12l2.5 1.5V10.25zm-2.8 0H.8V12l2.5 1.5V10.25zM14 4V1.5a1.5 1.5 0 0 0-1.5-1.5H1.5A1.5 1.5 0 0 0 0 1.5V12a1.5 1.5 0 0 0 1.5 1.5H4" />
                                    </svg>
                                    Export Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </>
    );
}

export default Settings;