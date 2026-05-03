const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', adminOnly, getAllUsers);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);

module.exports = router;
