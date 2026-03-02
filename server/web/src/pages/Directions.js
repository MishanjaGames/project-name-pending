import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { extendSession } from "../utils/utils";

function Directions({ data, onLogout }) {
  const navigate = useNavigate();
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDirections();
  }, []);

  const fetchData = async () => {
    await fetchDirections();
  }

  const fetchDirections = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4040/api/directions');

      if (response.status === 401) {
        await extendSession(data)
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data } = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setDirections(data);
      } else {
        console.warn('API returned empty-array data:', data);
        setDirections([]);
      }
    } catch (err) {
      console.error('Error fetching directions:', err);
      setDirections([]); // Set to empty array on error
      alert('Failed to load directions. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (directions) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete direction "${directions.directionName}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      let i = prompt(`You confirmed to proceed deleting direction "${directions.directionName}" \n\n This action cannot be undone.
                \n Please enter direction's name to continue.`)
      if (i === directions.directionName) {
        alert(`Role "${directions.directionName}" is DELETING. \n This action cannot be undone.`)

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:4040/api/directions/${directions._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            alert(`Direction "${directions.directionName}" is DELETED.`)
            fetchDirections()
          }
        } catch (error) {
          console.error('Error deleting direction:', error);
        }
      }
    }
  };

  const filteredDirections = Array.isArray(directions)
    ? directions.filter(direction =>
      direction.directionName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

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
          <h2 className="mb-0">Directions</h2>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/manage/directions/create')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Direction
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
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search directions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            {filteredDirections.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">No directions found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Direction Name</th>
                      <th>Created At</th>
                      <th>Updated At</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDirections.map((direction) => (
                      <tr key={direction._id}>
                        <td className="fw-bold">{direction.directionName}</td>
                        <td>{new Date(direction.createdAt).toLocaleDateString()}</td>
                        <td>{new Date(direction.updatedAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => navigate(`/manage/direction/${direction._id}`)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(direction)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-muted">
          <small>Total: {filteredDirections.length} direction(s)</small>
        </div>
      </div>
    </>
  );
}

export default Directions;