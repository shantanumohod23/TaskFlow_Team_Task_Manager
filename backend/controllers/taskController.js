const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/tasks?projectId=xxx - get tasks for a project
const getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { project: projectId } : {};

    // If member, only show tasks in their projects
    if (req.user.role === 'member') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);

      if (projectId && !projectIds.some((id) => id.toString() === projectId)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (!projectId) filter.project = { $in: projectIds };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tasks - admin only (enforced at route level too)
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    if (!project) {
      return res.status(400).json({ message: 'Project is required' });
    }

    // Verify project exists
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title: title.trim(),
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority,
      dueDate,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'project', select: 'name' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tasks/:id
// - Admins can update everything
// - Members can ONLY update status, and ONLY on tasks assigned to them
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'member') {
      // Check that this task is actually assigned to the logged-in member
      const assignedId = task.assignedTo?.toString();
      if (assignedId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      // Members can only flip the status — nothing else
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      const updated = await Task.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name');
      return res.json(updated);
    }

    // Admin: update whatever fields are sent
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id - admin or task creator
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isCreator) {
      return res.status(403).json({ message: 'Not allowed to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/dashboard/stats
// Admins see global stats across all tasks.
// Members see stats scoped only to tasks assigned to them.
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // Members only see their own assigned tasks
    const taskFilter =
      req.user.role === 'member' ? { assignedTo: req.user._id } : {};

    const [total, completed, inProgress, overdue, todo] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
      Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
      Task.countDocuments({
        ...taskFilter,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }),
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
    ]);

    // "pending" = everything not done
    const pending = total - completed;

    // Recent tasks — for members these are their assigned tasks; for admins, latest globally
    const recentTasks = await Task.find(taskFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.json({
      total,
      completed,
      inProgress,
      overdue,
      todo,
      pending,
      recentTasks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/my-tasks - tasks assigned to the current user
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
  getMyTasks,
};
