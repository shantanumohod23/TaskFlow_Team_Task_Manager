import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import PageHeader from '../components/layout/PageHeader';
import Modal from '../components/layout/Modal';
import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';
import { useAuth } from '../context/AuthContext';

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', projectId: '', priority: '' });

  const fetchTasks = useCallback(() => {
    setLoading(true);
    // Members only see tasks assigned to them (/my-tasks)
    // Admins see all tasks (/tasks)
    const tasksEndpoint = isAdmin ? '/tasks' : '/tasks/my-tasks';

    Promise.all([api.get(tasksEndpoint), api.get('/projects')])
      .then(([tasksRes, projectsRes]) => {
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load tasks');
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdated = (updated) =>
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

  const handleTaskDeleted = (id) =>
    setTasks((prev) => prev.filter((t) => t._id !== id));

  const handleTaskCreated = (task) => setTasks((prev) => [task, ...prev]);

  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.projectId && t.project?._id !== filters.projectId) return false;
    return true;
  });

  // For members: group by status for a cleaner view
  const myTaskGroups = !isAdmin ? {
    todo: (Array.isArray(filteredTasks) ? filteredTasks : []).filter((t) => t.status === 'todo'),
    'in-progress': (Array.isArray(filteredTasks) ? filteredTasks : []).filter((t) => t.status === 'in-progress'),
    done: (Array.isArray(filteredTasks) ? filteredTasks : []).filter((t) => t.status === 'done'),
  } : null;

  return (
    <div className="p-8">
      <PageHeader
        title={isAdmin ? 'All Tasks' : 'My Tasks'}
        subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
        action={
          isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              + New Task
            </button>
          )
        }
      />

      {/* Member helper banner */}
      {!isAdmin && (
        <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-800">
          <strong>How to complete tasks:</strong> Find your task below and click{' '}
          <span className="font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs">✓ Mark as Complete</span>{' '}
          to submit it for admin review.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="input w-auto text-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          className="input w-auto text-sm"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="input w-auto text-sm"
          value={filters.projectId}
          onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {(filters.status || filters.priority || filters.projectId) && (
          <button
            onClick={() => setFilters({ status: '', projectId: '', priority: '' })}
            className="btn-ghost text-sm"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm animate-pulse">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm">
            {isAdmin ? 'No tasks found.' : 'No tasks assigned to you yet. Ask your admin to assign tasks.'}
          </p>
        </div>
      ) : isAdmin ? (
        /* Admin: grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              showProject
              onUpdated={handleTaskUpdated}
              onDeleted={handleTaskDeleted}
            />
          ))}
        </div>
      ) : (
        /* Member: grouped view by status */
        <div className="space-y-8">
          {/* Pending tasks first (most actionable) */}
          {myTaskGroups['in-progress'].length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                In Progress ({myTaskGroups['in-progress'].length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {myTaskGroups['in-progress'].map((task) => (
                  <TaskCard key={task._id} task={task} showProject onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} />
                ))}
              </div>
            </section>
          )}

          {myTaskGroups.todo.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                To Do ({myTaskGroups.todo.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {myTaskGroups.todo.map((task) => (
                  <TaskCard key={task._id} task={task} showProject onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} />
                ))}
              </div>
            </section>
          )}

          {myTaskGroups.done.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Completed ({myTaskGroups.done.length}) — submitted for review
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {myTaskGroups.done.map((task) => (
                  <TaskCard key={task._id} task={task} showProject onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal only renders for admins */}
      {isAdmin && (
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task">
          <TaskForm
            projects={projects}
            onClose={() => setShowCreate(false)}
            onCreated={handleTaskCreated}
          />
        </Modal>
      )}
    </div>
  );
}
