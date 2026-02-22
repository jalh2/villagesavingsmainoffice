const asyncHandler = require('express-async-handler');
const Questionnaire = require('../models/Questionnaire');
const Group = require('../models/Group');

const getAllQuestionnaires = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.groupId) {
    filter.group = req.query.groupId;
  }
  const questionnaires = await Questionnaire.find(filter)
    .sort({ createdAt: -1 })
    .populate('group', 'groupName');
  res.json(questionnaires);
});

const getQuestionnaireById = asyncHandler(async (req, res) => {
  const questionnaire = await Questionnaire.findById(req.params.id).populate('group', 'groupName');
  if (!questionnaire) {
    res.status(404);
    throw new Error('Questionnaire not found');
  }
  res.json(questionnaire);
});

const createQuestionnaire = asyncHandler(async (req, res) => {
  const { group } = req.body;
  if (!group) {
    res.status(400);
    throw new Error('group is required');
  }

  const groupRecord = await Group.findById(group);
  if (!groupRecord) {
    res.status(404);
    throw new Error('Group not found');
  }

  const questionnaire = await Questionnaire.create({
    ...req.body,
    createdBy: req.user?.id,
    createdByEmail: req.user?.email,
  });

  res.status(201).json(questionnaire);
});

const updateQuestionnaire = asyncHandler(async (req, res) => {
  const questionnaire = await Questionnaire.findById(req.params.id);
  if (!questionnaire) {
    res.status(404);
    throw new Error('Questionnaire not found');
  }

  if (req.body.group) {
    const groupRecord = await Group.findById(req.body.group);
    if (!groupRecord) {
      res.status(404);
      throw new Error('Group not found');
    }
  }

  Object.keys(req.body || {}).forEach((field) => {
    questionnaire[field] = req.body[field];
  });

  await questionnaire.save();
  res.json(questionnaire);
});

const deleteQuestionnaire = asyncHandler(async (req, res) => {
  const questionnaire = await Questionnaire.findById(req.params.id);
  if (!questionnaire) {
    res.status(404);
    throw new Error('Questionnaire not found');
  }

  await Questionnaire.findByIdAndDelete(req.params.id);
  res.json({ message: 'Questionnaire deleted successfully' });
});

module.exports = {
  getAllQuestionnaires,
  getQuestionnaireById,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
};
