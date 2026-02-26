const express = require('express');
const {
  getAllVslaIndividualBaselines,
  getVslaIndividualBaselineById,
  createVslaIndividualBaseline,
  updateVslaIndividualBaseline,
  deleteVslaIndividualBaseline,
} = require('../controllers/vslaIndividualBaselineController');
const { identifyUserFromHeader, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(identifyUserFromHeader);

router.get('/', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getAllVslaIndividualBaselines);
router.get('/:id', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getVslaIndividualBaselineById);
router.post('/', authorizeRoles('admin', 'manager', 'staff', 'field agent'), createVslaIndividualBaseline);
router.put('/:id', authorizeRoles('admin', 'manager', 'staff', 'field agent'), updateVslaIndividualBaseline);
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteVslaIndividualBaseline);

module.exports = router;
