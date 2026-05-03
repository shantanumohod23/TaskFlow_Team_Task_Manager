const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(protect); // all project routes require auth

router.get('/', getProjects);
router.post('/', adminOnly, createProject);

router.get('/:id', getProjectById);
router.put('/:id', adminOnly, updateProject);
router.delete('/:id', adminOnly, deleteProject);

router.post('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

module.exports = router;
