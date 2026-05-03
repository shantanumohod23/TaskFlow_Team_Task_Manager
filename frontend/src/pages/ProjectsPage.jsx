import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Modal from '../components/layout/Modal';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    try {
      setLoading(true);
      const { data } = await api.post('/projects', form);
      onCreated(data);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Project Name</label>
        <input
          className="input"
          placeholder="e.g. Website Redesign"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Description (optional)</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="What is this project about?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (project) => setProjects((prev) => [project, ...prev]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        action={
          isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              + New Project
            </button>
          )
        }
      />

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm">No projects found.</p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <span className={`badge ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {project.status}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                <span className="mx-2">·</span>
                <span>Owner: {project.owner?.name}</span>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2">
                <Link to={`/projects/${project._id}`} className="btn-secondary text-xs px-3 py-1.5">
                  View
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="text-xs text-red-400 hover:text-red-600 ml-auto"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      </Modal>
    </div>
  );
}
