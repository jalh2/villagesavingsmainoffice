const express = require('express');
const {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  getGroupStats,
  getGroupMembers,
  addGroupMember,
  deleteGroup,
} = require('../controllers/groupController');
const { identifyUserFromHeader, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(identifyUserFromHeader);

router.get('/', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getAllGroups);
router.get('/stats', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getGroupStats);
router.get('/:id', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getGroupById);
router.get('/:id/members', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getGroupMembers);
router.post('/:id/members', authorizeRoles('admin', 'manager', 'staff', 'field agent'), addGroupMember);
router.post('/', authorizeRoles('admin', 'manager', 'staff', 'field agent'), createGroup);
router.put('/:id', authorizeRoles('admin', 'manager', 'staff', 'field agent'), updateGroup);
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteGroup);

module.exports = router;
