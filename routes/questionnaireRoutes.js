const express = require('express');
const {
  getAllQuestionnaires,
  getQuestionnaireById,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
} = require('../controllers/questionnaireController');
const { identifyUserFromHeader, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(identifyUserFromHeader);

router.get('/', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getAllQuestionnaires);
router.get('/:id', authorizeRoles('admin', 'manager', 'staff', 'assets', 'field agent'), getQuestionnaireById);
router.post('/', authorizeRoles('admin', 'manager', 'staff', 'field agent'), createQuestionnaire);
router.put('/:id', authorizeRoles('admin', 'manager', 'staff', 'field agent'), updateQuestionnaire);
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteQuestionnaire);

module.exports = router;
