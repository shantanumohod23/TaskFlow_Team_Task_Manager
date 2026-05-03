import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// Used both from ProjectDetailPage (projectId+members pre-set)
// and from TasksPage (choose project from dropdown)
export default function TaskForm({ projectId, members, projects, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    project: projectId || '',
  });
  const [projectMembers, setProjectMembers] = useState(members || []);
  const [projectOwner, setProjectOwner] = useState(null);
  const [loading, setLoading] = useState(false);

  // When user selects a project from the dropdown, fetch its members + owner
  useEffect(() => {
    if (!projectId && form.project) {
      api.get(`/projects/${form.project}`).then(({ data }) => {
        setProjectMembers(data.members || []);
        setProjectOwner(data.owner || null);
      });
    }
  }, [form.project]);

  // Compute assignable users: members + owner (deduplicated)
  const assignableUsers = (() => {
    const all = [...(projectMembers || [])];
    if (projectOwner && !all.find((m) => m._id === projectOwner._id)) {
      all.unshift(projectOwner);
    }
    return all;
  })();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.project) return toast.error('Project is required');

    try {
      setLoading(true);
      const payload = {
        ...form,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      };
      const { data } = await api.post('/tasks', payload);
      onCreated(data);
      toast.success('Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input
          className="input"
          name="title"
          placeholder="Task title"
          value={form.title}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="label">Description (optional)</label>
        <textarea
          className="input resize-none"
          name="description"
          rows={3}
          placeholder="What needs to be done?"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Show project dropdown only when not scoped to a project already */}
      {!projectId && projects && (
        <div>
          <label className="label">Project *</label>
          <select className="input" name="project" value={form.project} onChange={handleChange}>
            <option value="">-- Select Project --</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Priority</label>
          <select className="input" name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="label">Due Date</label>
          <input
            className="input"
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label className="label">Assign To</label>
        <select className="input" name="assignedTo" value={form.assignedTo} onChange={handleChange}>
          <option value="">Unassigned</option>
          {assignableUsers.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
