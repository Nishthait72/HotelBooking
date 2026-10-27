import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StaffTasks = () => {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // New Task Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    room: '',
    priority: 'medium',
    dueDate: '',
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'all') queryParams.append('status', filterStatus);

      const res = await api.get(`/tasks?${queryParams.toString()}`);
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [staffRes, roomsRes] = await Promise.all([
        api.get('/auth/staff'),
        api.get('/rooms'),
      ]);
      if (staffRes.success) setStaffList(staffRes.data);
      if (roomsRes.success) setRooms(roomsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAuxData();
  }, [filterStatus]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        room: formData.room || null,
        assignedTo: formData.assignedTo || user.id,
      };

      const res = await api.post('/tasks', payload);
      if (res.success) {
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          assignedTo: '',
          room: '',
          priority: 'medium',
          dueDate: '',
        });
        fetchTasks();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="badge bg-danger">HIGH PRIORITY</span>;
      case 'medium':
        return <span className="badge bg-warning text-dark">MEDIUM</span>;
      case 'low':
        return <span className="badge bg-info text-dark">LOW</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-check2-square text-primary me-2"></i> Staff Workflows & Tasks
          </h2>
          <p className="text-muted mb-0">Housekeeping duties, maintenance dispatches, and guest service requests</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center mt-3 mt-md-0"
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              assignedTo: staffList[0]?._id || user.id,
              room: '',
              priority: 'medium',
              dueDate: '',
            });
            setModalError('');
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i> Assign New Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button
          className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('all')}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'in_progress' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('in_progress')}
        >
          In Progress
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('completed')}
        >
          Completed
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading tasks...</span>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-5 shadow-sm text-muted">
          <i className="bi bi-clipboard-check display-4 mb-2 text-success"></i>
          <h5>All clear! No tasks found</h5>
          <p>Assign housekeeping or maintenance tasks to staff members.</p>
        </div>
      ) : (
        <div className="row g-3">
          {tasks.map((task) => (
            <div key={task._id} className="col-md-6 col-lg-4">
              <div
                className={`card h-100 shadow-sm border-start border-4 ${
                  task.status === 'completed'
                    ? 'border-start-success'
                    : task.status === 'in_progress'
                    ? 'border-start-warning'
                    : 'border-start-primary'
                }`}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    {getPriorityBadge(task.priority)}
                    <span
                      className={`badge ${
                        task.status === 'completed'
                          ? 'bg-success'
                          : task.status === 'in_progress'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                      }`}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h5 className="fw-bold mb-2">{task.title}</h5>

                  {task.description && (
                    <p className="small text-muted mb-3 flex-grow-1">{task.description}</p>
                  )}

                  <div className="small text-muted mb-2">
                    <i className="bi bi-person me-1"></i> Assigned to:{' '}
                    <span className="fw-semibold text-dark">{task.assignedTo?.name || 'Staff'}</span>
                  </div>

                  {task.room && (
                    <div className="small text-muted mb-2">
                      <i className="bi bi-door-open me-1"></i> Room:{' '}
                      <span className="fw-semibold text-dark">
                        Room #{task.room?.roomNumber} (Floor {task.room?.floor})
                      </span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="small text-muted mb-3">
                      <i className="bi bi-clock me-1"></i> Due:{' '}
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="mt-auto pt-3 border-top d-flex gap-2 justify-content-between">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => updateTaskStatus(task._id, 'in_progress')}
                        className="btn btn-sm btn-outline-warning flex-grow-1"
                      >
                        Start Task
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => updateTaskStatus(task._id, 'completed')}
                        className="btn btn-sm btn-outline-success flex-grow-1"
                      >
                        Mark Completed
                      </button>
                    )}

                    {task.status === 'completed' && (
                      <button
                        onClick={() => updateTaskStatus(task._id, 'pending')}
                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                      >
                        Re-open
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Task"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Assign Staff Task</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div className="modal-body p-4">
                  {modalError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {modalError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Task Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Deep clean and restock Suite 401"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Description / Instructions</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Specific instructions, supplies needed, or guest notes..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Assign To</label>
                      <select
                        className="form-select"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      >
                        {staffList.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Associated Room (Optional)</label>
                      <select
                        className="form-select"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      >
                        <option value="">-- None --</option>
                        {rooms.map((r) => (
                          <option key={r._id} value={r._id}>
                            Room #{r.roomNumber} ({r.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Priority</label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffTasks;
