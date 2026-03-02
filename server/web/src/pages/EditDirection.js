import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

function EditDirection({ data, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [directionName, setDirectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDirection();
  }, [id]);

  const fetchDirection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4040/api/directions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDirectionName(data.directionName);
      } else {
        alert('Direction not found');
        navigate('/manage/directions');
      }
    } catch (err) {
      console.error('Error fetching direction:', err);
      alert('Failed to load direction');
      navigate('/manage/directions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!directionName.trim()) {
      alert('Please enter a direction name');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`http://localhost:4040/api/directions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          directionName: directionName.trim(),
          updatedAt: new Date()
        })
      });

      if (response.ok) {
        alert('Direction updated successfully');
        navigate('/manage/directions');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update direction');
      }
    } catch (err) {
      console.error('Error updating direction:', err);
      alert('Failed to update direction');
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
          <h2 className="mb-0">Edit Direction</h2>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/manage/directions')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Directions
          </button>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Direction Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={directionName}
                      onChange={(e) => setDirectionName(e.target.value)}
                      placeholder="e.g., Programming, Design, Marketing"
                      required
                    />
                    <small className="text-muted">
                      Update the direction name
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
                      onClick={() => navigate('/manage/directions')}
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
              <strong>Warning:</strong> Changing this direction name will affect
              all associated levels and courses using this direction.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditDirection;