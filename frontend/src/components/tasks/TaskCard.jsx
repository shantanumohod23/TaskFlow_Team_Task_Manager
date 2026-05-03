import { useState } from 'react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

const priorityClass = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
};

const statusOptions = ['todo', 'in-progress', 'done'];
const statusLabels = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

export default function TaskCard({ task, showProject = false, onUpdated, onDeleted }) {
  const { isAdmin, user } = useAuth();
  const [status, setStatus] = useState(task.status);
  const [updating, setUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';

  // Only the assigned user or an admin can change the status
  const isAssignedToMe = task.assignedTo?._id === user?._id;
  const canUpdateStatus = isAdmin || isAssignedToMe;

  // Only admin or the task creator can delete
  const canDelete = isAdmin || task.createdBy?._id === user?._id;

  const handleStatusChange = async (newStatus, silent = false) => {
    if (!canUpdateStatus) {
      toast.error('You can only update tasks assigned to you');
      return;
    }
    if (newStatus === status) return;
    try {
      setUpdating(true);
      setStatus(newStatus); // optimistic update
      const { data } = await api.put(`/tasks/${task._id}`, { status: newStatus });
      onUpdated(data);
      if (!silent) {
        if (newStatus === 'done') {
          toast.success('✅ Task marked as complete!');
        } else {
          toast.success('Status updated');
        }
      }
    } catch (err) {
      setStatus(task.status); // revert on failure
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
      setShowConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted(task._id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // For members completing their task — show confirmation dialog
  const handleMemberComplete = () => {
    setShowConfirm(true);
  };

  return (
    <div className={`card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow ${updating ? 'opacity-70' : ''}`}>
      {/* Completion confirmation for members */}
      {showConfirm && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-emerald-800">Mark this task as complete?</p>
          <p className="text-xs text-emerald-600">This will notify the admin that you've finished this task.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 text-xs py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStatusChange('done')}
              disabled={updating}
              className="flex-1 text-xs py-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 font-medium"
            >
              {updating ? 'Submitting...' : 'Submit as Done'}
            </button>
          </div>
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-800 leading-snug">{task.title}</h4>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="text-slate-300 hover:text-red-400 transition-colors text-xs shrink-0"
            title="Delete task"
          >
            ✕
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}

      {/* Meta badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={priorityClass[task.priority]}>{task.priority}</span>
        {isOverdue && <span className="badge-overdue">overdue</span>}
        {status === 'done' && <span className="badge bg-emerald-100 text-emerald-700">✓ completed</span>}
        {showProject && task.project?.name && (
          <span className="badge bg-slate-100 text-slate-600">{task.project.name}</span>
        )}
      </div>

      {/* Due date & assignee */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {task.assignedTo ? `→ ${task.assignedTo.name}` : 'Unassigned'}
        </span>
        {task.dueDate && (
          <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
            {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* 
        For MEMBERS assigned to this task: show a prominent "Mark Complete" button
        For ADMINS: show the full status picker 
      */}
      {isAdmin ? (
        /* Admin: full status picker */
        <div
          className="flex gap-1 pt-1 border-t border-slate-50"
          title={!canUpdateStatus ? 'Only the assigned user can change status' : ''}
        >
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={updating || !canUpdateStatus}
              className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${
                !canUpdateStatus
                  ? 'text-slate-300 cursor-not-allowed'
                  : status === s
                  ? s === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : s === 'in-progress'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-700'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      ) : isAssignedToMe ? (
        /* Member assigned to this task: status controls + complete button */
        <div className="pt-1 border-t border-slate-50 space-y-2">
          <div className="flex gap-1">
            {['todo', 'in-progress'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updating || status === 'done'}
                className={`flex-1 text-xs py-1 rounded-md font-medium transition-colors ${
                  status === s
                    ? s === 'in-progress'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-700'
                    : status === 'done'
                    ? 'text-slate-200 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
          {status !== 'done' && !showConfirm && (
            <button
              onClick={handleMemberComplete}
              disabled={updating}
              className="w-full text-xs py-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors"
            >
              ✓ Mark as Complete
            </button>
          )}
          {status === 'done' && (
            <p className="text-xs text-center text-emerald-600 font-medium py-1">
              ✅ Submitted — awaiting admin review
            </p>
          )}
        </div>
      ) : (
        /* Member not assigned: show read-only status */
        <div className="pt-1 border-t border-slate-50">
          <span className="text-xs text-slate-400">
            Status: <span className="font-medium text-slate-600">{statusLabels[status]}</span>
          </span>
        </div>
      )}
    </div>
  );
}
