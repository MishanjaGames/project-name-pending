import { Navbar } from "../components/Navbar";
import { useState, useEffect } from "react";
import { formatLaunchTime, formatUptime, getTimeAgo, useTimeout } from "../utils/utils";
import { extendSession } from "../utils/utils";

function Main({ data, onLogout }) {
  const [serverStatus, setServerStatus] = useState({
    status: 'ok',
    db_status: 'ok',
    uptime: '45d 12h 30m',
    launchTime: undefined,
    cpuUsage: 35,
    memoryUsage: 62,
    diskUsage: 48
  });

  const [adminStats, setAdminStats] = useState({
    totalUsers: '???',
    activeUsers: '???',
    totalCourses: '???',
    enrollments: '???',
  });

  useEffect(() => {
    updateInfo()
  }, []);

  const { reset } = useTimeout(async () => {
    await updateInfo()
    reset()
  }, 10000)

  const updateInfo = async () => {
    try {
      const loginData = localStorage.getItem('token')
      const response = await fetch('http://localhost:4040/api/utils/status', {
        method: 'GET',
        headers: {
          'Authorization': `${loginData.split(' ')[0]} ${loginData.split(' ')[1]}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        extendSession(data)
      }

      if (response.ok) {
        const res = await response.json();
        setServerStatus((p) => {
          return {
            ...p,
            uptime: res.uptime,
            status: res.status,
            db_status: res.db_status,
            launchTime: res.launchTime
          }
        });
        setAdminStats((p) => {
          return {
            ...p,
            totalUsers: res.users.length,
            totalCourses: res.courses.length,
            db_status: res.db_status
          }
        });
      }
    } catch (error) {
      console.error('SERVER NOT RESPONDING', error);
      setServerStatus((p) => {
        return {
          ...p,
          status: 'fixing'
        }
      });
    }
  }

  return (
    <>
      <Navbar data={data} onLogout={onLogout} />

      <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
              <div>
                <h1 className="h3 h2-md fw-bold text-dark mb-1">Server Admin Dashboard</h1>
                <p className="text-muted mb-0 small">Server status and system information</p>
              </div>
              {/*
                <div className="d-none d-lg-block">
                  <div className="badge bg-success p-2 px-3">
                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16" className="me-2" style={{display: 'inline'}}>
                      <circle cx="8" cy="8" r="8"/>
                    </svg>
                    {serverStatus.status.toUpperCase()}
                  </div>
                </div>
                */}
            </div>
          </div>
        </div>

        {/* Server Status Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="text-muted mb-0 small text-uppercase">Server Uptime</h6>
                  <svg width="20" height="20" fill="#0d6efd" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.854 1.927a.5.5 0 0 1-.408.934L7.5 9.71V3.5a.5.5 0 0 1 .5-.5z" />
                  </svg>
                </div>
                {
                  serverStatus.status === 'ok' ?
                    <>
                      <h3 className="fw-bold mb-1 h4">{formatUptime(serverStatus.uptime)}</h3>
                      <small className="text-success">✓ Stable</small></> :
                    <>
                      <h3 className="fw-bold mb-1 h4">?????????????</h3>
                      <small className="text-warning">? Reaching...</small></>
                }

              </div>
            </div>
          </div>

          {/*
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="text-muted mb-0 small text-uppercase">CPU Usage</h6>
                    <svg width="20" height="20" fill="#ffc107" viewBox="0 0 16 16">
                      <path d="M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0zm-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3h-7zM5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5v-3zM6.5 6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
                    </svg>
                  </div>
                  <h3 className="fw-bold mb-1 h4">{serverStatus.cpuUsage}%</h3>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar bg-warning" style={{width: `${serverStatus.cpuUsage}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
            */}

          {/*
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="text-muted mb-0 small text-uppercase">Memory Usage</h6>
                    <svg width="20" height="20" fill="#17a2b8" viewBox="0 0 16 16">
                      <path d="M3 0h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1a1 1 0 0 1 1-1zm0 1v14h10V1H3z"/>
                      <path d="M5 2h6a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                  </div>
                  <h3 className="fw-bold mb-1 h4">{serverStatus.memoryUsage}%</h3>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar bg-info" style={{width: `${serverStatus.memoryUsage}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
            */}

          {/*
            <div className="col-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="text-muted mb-0 small text-uppercase">Disk Usage</h6>
                    <svg width="20" height="20" fill="#6f42c1" viewBox="0 0 16 16">
                      <path d="M4.5 7a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm3 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2z"/>
                    </svg>
                  </div>
                  <h3 className="fw-bold mb-1 h4">{serverStatus.diskUsage}%</h3>
                  <div className="progress" style={{height: '4px'}}>
                    <div className="progress-bar" style={{width: `${serverStatus.diskUsage}%`, backgroundColor: '#6f42c1'}}></div>
                  </div>
                </div>
              </div>
            </div>
            */}

          {/* Admin Statistics */}
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-3">
                <h6 className="text-muted mb-2 small text-uppercase">Total Users</h6>
                {
                  (adminStats.totalUsers > 0 && serverStatus.status === 'ok') ? <h2 className="fw-bold text-primary mb-1 h3">{adminStats.totalUsers}</h2> : <h2 className="fw-bold text-secondary mb-1 h3">???</h2>
                }
                {
                  (adminStats.totalUsers > 0 && serverStatus.status === 'ok') ? <small className="text-muted">{adminStats.activeUsers} in process of learning</small> : <small className="text-warning">??? in process of learning</small>
                }
              </div>
            </div>
          </div>

          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-3">
                <h6 className="text-muted mb-2 small text-uppercase">Total Courses</h6>
                {
                  (adminStats.totalCourses > 0 || serverStatus.status === 'ok') ? <h2 className="fw-bold text-primary mb-1 h3">{adminStats.totalCourses}</h2> : <h2 className="fw-bold text-secondary mb-1 h3">???</h2>
                }
                {
                  (adminStats.totalCourses > 0 || serverStatus.status === 'ok') ? <small className="text-muted">{adminStats.enrollments} being checked</small> : <small className="text-warning">??? being checked</small>
                }
              </div>
            </div>
          </div>

          {/*
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-3">
                  <h6 className="text-muted mb-2 small text-uppercase">Total Roles</h6>
                  <h2 className="fw-bold text-warning mb-1 h3">{adminStats.totalRoles}</h2>
                  <small className="text-muted">{adminStats.activeRoles} active</small>
                </div>
              </div>
            </div>
            */}

          {/*
            <div className="col-6 col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-3">
                  <h6 className="text-muted mb-2 small text-uppercase">API Status</h6>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-success">ONLINE</span>
                    <small className="text-muted">Responding</small>
                  </div>
                </div>
              </div>
            </div>
            */}

          <div className="col-6 col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-3">
                <h6 className="text-muted mb-2 small text-uppercase">Database status</h6>
                {
                  serverStatus.db_status === 'connected' && serverStatus.status === 'ok' ?
                    <>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success">CONNECTED</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-success">SYNCED</span>
                      </div>
                    </> :
                    serverStatus.status === 'fixing' || serverStatus.db_status === 'reconnecting' ?
                      <>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-warning">CONNECTING</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-warning">SYNCING</span>
                        </div>
                      </> :
                      <>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-danger">DISCONNECTED</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-danger">NOT SYNCED</span>
                        </div>
                      </>
                }
              </div>
            </div>
          </div>
        </div>

        {/* System Info and Server Health */}
        <div className="row g-1 mb-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3">
                <h5 className="mb-0">System Information</h5>
              </div>
              <div className="card-body">
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" width="40%"><strong>Server Status:</strong></td>
                      <td>
                        {
                          serverStatus.status === 'ok' ?
                            <span className="badge bg-success">Connected</span>
                            :
                            <span className="badge bg-warning">Reconnecting</span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>MongoDB Status:</strong></td>
                      <td>
                        {
                          serverStatus.status === 'ok' && serverStatus.db_status === 'connected' ?
                            <span className="badge bg-success">Connected</span>
                            :
                            serverStatus.status === 'fixing' || serverStatus.db_status === 'reconnecting' ?
                              <span className="badge bg-warning">Reconnecting</span>
                              :
                              <span className="badge bg-danger">Disconnected</span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Last Restart:</strong></td>
                      <td>
                        <div>
                          {formatLaunchTime(serverStatus.launchTime)}
                          <small className="text-muted"> ({getTimeAgo(serverStatus.launchTime)})</small>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/*
          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="mb-0">Server Health</h5>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small text-muted">Overall Health</span>
                      <span className="fw-bold text-success">98%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-success" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small text-muted">Response Time</span>
                      <span className="fw-bold">45ms</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-info" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small text-muted">Error Rate</span>
                      <span className="fw-bold text-success">0.2%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-success" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          */}
      </div>
    </>
  )
}

export default Main;