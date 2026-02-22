const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
} = require('../controllers/userController');
const { identifyUserFromHeader, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(identifyUserFromHeader);

router.get('/', authorizeRoles('admin', 'manager'), getAllUsers);
router.get('/:id', authorizeRoles('admin', 'manager'), getUserById);
router.post('/', authorizeRoles('admin', 'manager'), createUser);
router.put('/:id', authorizeRoles('admin', 'manager'), updateUser);
router.patch('/:id/password', authorizeRoles('admin', 'manager'), changePassword);
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteUser);

module.exports = router;
