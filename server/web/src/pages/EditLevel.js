import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

function EditLevel({ data, onLogout}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [levelName, setLevelName] = useState('');
  const [directionName, setDirectionName] = useState('');
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both the level and all directions
      const [levelRes, directionsRes] = await Promise.all([
        fetch(`http://localhost:4040/api/levels/${id}`),
        fetch('http://localhost:4040/api/directions')
      ]);

      if (levelRes.ok) {
        const levelData = await levelRes.json();
        setLevelName(levelData.levelName);
        setDirectionName(levelData.directionName);
      } else {
        alert('Level not found');
        navigate('/manage/levels');
        return;
      }

      if (directionsRes.ok) {
        const directionsData = await directionsRes.json();
        
        // Ensure data is an array
        if (Array.isArray(directionsData)) {
          setDirections(directionsData);
        } else {
          console.error('Directions API returned non-array data:', directionsData);
          setDirections([]);
        }
      } else {
        console.error('Failed to fetch directions');
        setDirections([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setDirections([]);
      alert('Failed to load data. Please check your connection.');
      navigate('/manage/levels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!levelName.trim()) {
      alert('Please enter a level name');
      return;
    }

    if (!directionName) {
      alert('Please select a direction');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`http://localhost:4040/api/levels/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          levelName: levelName.trim(),
          directionName: directionName,
          updatedAt: new Date()
        })
      });

      if (response.ok) {
        alert('Level updated successfully');
        navigate('/manage/levels');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update level');
      }
    } catch (err) {
      console.error('Error updating level:', err);
      alert('Failed to update level');
    } finally {
      setSaving(false);
    }
  };

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
          <h2 className="mb-0">Edit Level</h2>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/manage/levels')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Levels
          </button>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Direction <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={directionName}
                      onChange={(e) => setDirectionName(e.target.value)}
                      required
                    >
                      <option value="">Select a direction</option>
                      {directions.map((dir) => (
                        <option key={dir._id} value={dir.directionName}>
                          {dir.directionName}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Change the direction this level belongs to
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Level Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={levelName}
                      onChange={(e) => setLevelName(e.target.value)}
                      placeholder="e.g., Beginner, Intermediate, Advanced"
                      required
                    />
                    <small className="text-muted">
                      Update the level name
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate('/manage/levels')}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="alert alert-warning mt-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> Changing this level's direction or name 
              will affect all courses associated with this level.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditLevel;