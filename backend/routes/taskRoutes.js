const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
  getMyTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(protect); // all task routes require auth

// IMPORTANT: specific routes MUST come before /:id param routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/my-tasks', getMyTasks);

router.get('/', getTasks);
router.post('/', adminOnly, createTask);

router.get('/:id', getTaskById);
router.put('/:id', updateTask);   // members can update status of their own tasks
router.delete('/:id', deleteTask);

module.exports = router;
