import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import PageHeader from '../components/layout/PageHeader';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, color, icon, bg }) => (
  <div className={`card p-5 border-l-4 ${bg || 'border-slate-200'}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`text-lg ${color}`}>{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const statusBadge = (status) => {
  const map = {
    todo: 'badge-todo',
    'in-progress': 'badge-in-progress',
    done: 'badge-done',
  };
  return <span className={map[status] || 'badge-todo'}>{status}</span>;
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = () => {
    setLoading(true);
    api.get('/tasks/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load dashboard stats';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-slate-400 text-sm animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card p-6 text-center text-red-500 text-sm">
          {error} — <button onClick={fetchStats} className="underline">try again</button>
        </div>
      </div>
    );
  }

  // For admin: tasks that are "done" but recently completed = items for admin review
  const completedForReview = isAdmin
    ? (stats?.recentTasks || []).filter((t) => t.status === 'done')
    : [];

  return (
    <div className="p-8">
      <PageHeader
        title={`Good day, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={
          isAdmin
            ? 'Overview of all tasks across all projects.'
            : 'Your assigned tasks overview.'
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tasks"
          value={stats?.total ?? 0}
          color="text-slate-700"
          icon="◉"
          bg="border-slate-300"
        />
        <StatCard
          label="Completed"
          value={stats?.completed ?? 0}
          color="text-emerald-600"
          icon="✓"
          bg="border-emerald-400"
        />
        <StatCard
          label="Pending"
          value={stats?.pending ?? 0}
          color="text-amber-600"
          icon="↻"
          bg="border-amber-400"
        />
        <StatCard
          label="Overdue"
          value={stats?.overdue ?? 0}
          color="text-red-600"
          icon="⚠"
          bg="border-red-400"
        />
      </div>

      {/* Admin: Completed tasks pending review */}
      {isAdmin && completedForReview.length > 0 && (
        <div className="card mb-6 border border-emerald-100">
          <div className="px-5 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50 rounded-t-xl">
            <div>
              <h2 className="font-semibold text-emerald-800">✅ Tasks Completed by Members</h2>
              <p className="text-xs text-emerald-600 mt-0.5">These tasks have been marked done — review and confirm</p>
            </div>
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {completedForReview.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {completedForReview.map((task) => (
              <div key={task._id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {task.project?.name}
                    {task.assignedTo && (
                      <span className="ml-2 text-emerald-600">· Completed by {task.assignedTo.name}</span>
                    )}
                  </p>
                </div>
                <span className="badge bg-emerald-100 text-emerald-700 shrink-0">✓ done</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member: quick action link */}
      {!isAdmin && (
        <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-800">Your Tasks</p>
            <p className="text-xs text-sky-600">
              {stats?.total ?? 0} assigned · {stats?.completed ?? 0} completed · {stats?.pending ?? 0} pending
            </p>
          </div>
          <Link to="/tasks" className="btn-primary text-sm">View My Tasks →</Link>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            {isAdmin ? 'Recent Tasks' : 'My Recent Tasks'}
          </h2>
          <Link to="/tasks" className="text-sm text-sky-600 hover:underline">View all</Link>
        </div>

        {!stats?.recentTasks?.length ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {isAdmin ? 'No tasks yet. Create a project and add tasks to get started.' : 'No tasks assigned to you yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(stats?.recentTasks || []).map((task) => {
              const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
              return (
                <div key={task._id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {task.project?.name}
                      {task.assignedTo && (
                        <span className="ml-2">· {task.assignedTo.name}</span>
                      )}
                      {task.dueDate && (
                        <span className={`ml-2 ${isOverdue ? 'text-red-500' : ''}`}>
                          · Due {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOverdue && <span className="badge-overdue">overdue</span>}
                    {statusBadge(task.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
