import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/layout/Modal';
import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';

function AddMemberModal({ projectId, existingMembers, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users').then(({ data }) => {
      const memberIds = existingMembers.map((m) => m._id);
      setUsers(data.filter((u) => !memberIds.includes(u._id)));
    }).catch(() => toast.error('Failed to load users'));
  }, [existingMembers]);

  const handleAdd = async () => {
    if (!selectedUserId) return toast.error('Select a user');
    try {
      setLoading(true);
      const { data } = await api.post(`/projects/${projectId}/members`, { userId: selectedUserId });
      onAdded(data);
      toast.success('Member added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Select User</label>
        <select className="input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">-- Choose a user --</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
          ))}
        </select>
        {users.length === 0 && (
          <p className="text-xs text-slate-400 mt-1">All registered users are already members.</p>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button onClick={handleAdd} className="btn-primary flex-1 justify-center" disabled={loading || !selectedUserId}>
          {loading ? 'Adding...' : 'Add Member'}
        </button>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?projectId=${id}`),
    ])
      .then(([projRes, taskRes]) => {
        setProject(projRes.data);
        setTasks(taskRes.data);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load project');
        navigate('/projects');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m._id !== userId) }));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleTaskCreated = (task) => setTasks((prev) => [task, ...prev]);

  const handleTaskUpdated = (updatedTask) =>
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));

  const handleTaskDeleted = (taskId) =>
    setTasks((prev) => prev.filter((t) => t._id !== taskId));

  if (loading) return <div className="p-8 text-slate-400 text-sm animate-pulse">Loading project...</div>;
  if (!project) return null;

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    'in-progress': tasks.filter((t) => t.status === 'in-progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const columns = [
    { key: 'todo', label: 'To Do', color: 'bg-slate-100', count: tasksByStatus.todo.length },
    { key: 'in-progress', label: 'In Progress', color: 'bg-amber-50', count: tasksByStatus['in-progress'].length },
    { key: 'done', label: 'Done', color: 'bg-emerald-50', count: tasksByStatus.done.length },
  ];

  // All members including owner for TaskForm
  const allProjectMembers = [
    ...(project.members || []),
  ];

  return (
    <div className="p-8">
      {/* Project header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => navigate('/projects')} className="text-xs text-slate-400 hover:text-slate-600 mb-2 flex items-center gap-1">
              ← Back to projects
            </button>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.description && <p className="text-slate-500 text-sm mt-1">{project.description}</p>}
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreateTask(true)} className="btn-primary">
              + Add Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kanban board */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map(({ key, label, color, count }) => (
              <div key={key} className={`rounded-xl ${color} p-4 min-h-[300px]`}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
                  <span className="ml-auto text-xs font-mono bg-white/70 text-slate-500 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[key].length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No tasks</p>
                  ) : (
                    tasksByStatus[key].map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onUpdated={handleTaskUpdated}
                        onDeleted={handleTaskDeleted}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Members sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Members</h3>
              {isAdmin && (
                <button onClick={() => setShowAddMember(true)} className="text-xs text-sky-600 hover:underline">
                  + Add
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* Owner */}
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-xs shrink-0">
                  {project.owner?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 truncate">{project.owner?.name}</p>
                  <p className="text-xs text-slate-400">Owner · Admin</p>
                </div>
              </div>

              {project.members?.map((member) => {
                const memberTasks = tasks.filter((t) => t.assignedTo?._id === member._id);
                const doneTasks = memberTasks.filter((t) => t.status === 'done');
                return (
                  <div key={member._id} className="flex items-start gap-2 group p-2 rounded-lg hover:bg-slate-50">
                    <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-xs shrink-0 mt-0.5">
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 truncate">{member.name}</p>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      {/* Task progress per member */}
                      {memberTasks.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {doneTasks.length}/{memberTasks.length} tasks done
                          {doneTasks.length === memberTasks.length && memberTasks.length > 0 && (
                            <span className="ml-1 text-emerald-600 font-medium">✓</span>
                          )}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs mt-1"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {project.members?.length === 0 && (
                <p className="text-xs text-slate-400 py-2 text-center">No members yet.</p>
              )}
            </div>
          </div>

          {/* Project stats card */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Progress</h3>
            <div className="space-y-2">
              {columns.map(({ key, label, color, count }) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-700">{count}</span>
                </div>
              ))}
              {tasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Overall completion</span>
                    <span>{Math.round((tasksByStatus.done.length / tasks.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(tasksByStatus.done.length / tasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <AddMemberModal
          projectId={id}
          existingMembers={[project.owner, ...(project.members || [])]}
          onClose={() => setShowAddMember(false)}
          onAdded={setProject}
        />
      </Modal>

      <Modal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} title="Create Task">
        <TaskForm
          projectId={id}
          members={allProjectMembers}
          onClose={() => setShowCreateTask(false)}
          onCreated={handleTaskCreated}
        />
      </Modal>
    </div>
  );
}
