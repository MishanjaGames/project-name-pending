import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { extendSession } from "../utils/utils";

function Levels({ data, onLogout }) {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both levels and directions
      const [levelsRes, directionsRes] = await Promise.all([
        fetch('http://localhost:4040/api/levels'),
        fetch('http://localhost:4040/api/directions')
      ]);
      if (levelsRes.status === 401 || directionsRes.status === 401) {
        await extendSession(data)
      }

      if (!levelsRes.ok || !directionsRes.ok) {
        throw new Error('HTTP error! One or more requests failed');
      }

      const levelData = await levelsRes.json();

      // Ensure data is arrays
      if (Array.isArray(levelData.data)) {
        setLevels(levelData.data);
      } else {
        console.warn('Levels API returned empty-array data:', levelData);
        setLevels([]);
      }

      const directionData = await directionsRes.json();

      if (Array.isArray(directionData.data)) {
        setDirections(directionData.data);
      } else {
        console.warn('Directions API returned empty-array data:', directionData);
        setDirections([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setLevels([]); // Set to empty arrays on error
      setDirections([]);
      alert('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (level) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete level "${level.levelName}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      let i = prompt(`You confirmed to proceed deleting level "${level.levelName}" (${level.directionName}) \n\n This action cannot be undone.
                \n Please enter level's name to continue.`)
      if (i === level.levelName) {
        alert(`Role "${level.levelName}" (${level.directionName}) is DELETING. \n This action cannot be undone.`)

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:4040/api/levels/${level._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            alert(`Level "${level.levelName}" (${level.directionName}) is DELETED.`)
            fetchData()
          }
        } catch (error) {
          console.error('Error deleting level:', error);
        }
      }
    }
  };

  const filteredLevels = Array.isArray(levels)
    ? levels.filter(level => {
      const matchesSearch = level.levelName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDirection = !filterDirection || level.directionName === filterDirection;
      return matchesSearch && matchesDirection;
    })
    : [];

  // Group levels by direction
  const levelsByDirection = filteredLevels.reduce((acc, level) => {
    if (!acc[level.directionName]) {
      acc[level.directionName] = [];
    }
    acc[level.directionName].push(level);
    return acc;
  }, {});

  if (loading) {
    return (
      <>
        <Navbar data={data} onLogout={onLogout} />
        <div className="p-3 p-md-4 bg-light" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar data={data} onLogout={onLogout} />
      <div className="p-3 p-md-4 bg-light" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Levels</h2>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/manage/levels/create')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Level
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => fetchData()}
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

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search levels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={filterDirection}
                  onChange={(e) => setFilterDirection(e.target.value)}
                >
                  <option value="">All Directions</option>
                  {directions.map((dir) => (
                    <option key={dir._id} value={dir.directionName}>
                      {dir.directionName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDirection('');
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredLevels.length === 0 ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No levels found</p>
                {filterDirection && (
                  <button
                    className="btn btn-primary mt-2"
                    onClick={() => setFilterDirection('')}
                  >
                    Clear Direction Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {Object.keys(levelsByDirection).sort().map((directionName) => (
              <div key={directionName} className="card shadow-sm mb-3">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-folder me-2"></i>
                    {directionName}
                    <span className="badge bg-light text-primary ms-2">
                      {levelsByDirection[directionName].length}
                    </span>
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Level Name</th>
                          <th>Created At</th>
                          <th>Updated At</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelsByDirection[directionName].map((level) => (
                          <tr key={level._id}>
                            <td className="fw-bold">{level.levelName}</td>
                            <td>{new Date(level.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(level.updatedAt).toLocaleDateString()}</td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => navigate(`/manage/level/${level._id}`)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(level)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="mt-3 text-muted">
          <small>
            Total: {filteredLevels.length} level(s)
            {filterDirection && ` in ${filterDirection}`}
          </small>
        </div>
      </div>
    </>
  );
}

export default Levels;