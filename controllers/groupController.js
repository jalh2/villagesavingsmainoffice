const asyncHandler = require('express-async-handler');
const Group = require('../models/Group');
const Questionnaire = require('../models/Questionnaire');
const { MEMBER_GENDERS, MEMBER_POSITIONS } = require('../config/groupMembers');

const normalizeMember = (member = {}) => ({
  name: String(member.name || '').trim(),
  position: String(member.position || '').trim().toLowerCase(),
  contact: String(member.contact || '').trim(),
  gender: String(member.gender || '').trim().toLowerCase(),
  signature: String(member.signature || '').trim(),
});

const validateMembers = (members) => {
  if (!Array.isArray(members)) {
    return 'members must be an array';
  }

  for (let index = 0; index < members.length; index += 1) {
    const member = normalizeMember(members[index]);
    if (!member.name || !member.position || !member.contact || !member.gender) {
      return `Member ${index + 1}: name, position, contact and gender are required`;
    }
    if (!MEMBER_POSITIONS.includes(member.position)) {
      return `Member ${index + 1}: invalid position`;
    }
    if (!MEMBER_GENDERS.includes(member.gender)) {
      return `Member ${index + 1}: invalid gender`;
    }
  }

  return null;
};

const canAccessAllRecords = (req) => String(req.user?.role || '').trim().toLowerCase() === 'admin';

const ensureGroupAccess = (req, group) => {
  if (!group) return;
  if (canAccessAllRecords(req)) return;

  const groupCreatedBy = String(group.createdByEmail || '').trim().toLowerCase();
  const requesterEmail = String(req.user?.email || '').trim().toLowerCase();

  if (!groupCreatedBy || groupCreatedBy !== requesterEmail) {
    req.res.status(404);
    throw new Error('Group not found');
  }
};

const getAllGroups = asyncHandler(async (req, res) => {
  const filter = canAccessAllRecords(req) ? {} : { createdByEmail: req.user?.email };
  const groups = await Group.find(filter).sort({ createdAt: -1 });
  res.json(groups);
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }
  ensureGroupAccess(req, group);
  res.json(group);
});

const createGroup = asyncHandler(async (req, res) => {
  const {
    groupName,
    chairpersonName,
    chairpersonPhone,
    recordKeeperName,
    recordKeeperPhone,
    registrationAmount,
    registrationDate,
    trainingDate,
    meetingDate,
    meetingTime,
    groupLocation,
    district,
    county,
    numberOfMembers,
    members,
  } = req.body;

  let normalizedMembers = [];
  if (members !== undefined) {
    const memberError = validateMembers(members);
    if (memberError) {
      res.status(400);
      throw new Error(memberError);
    }
    normalizedMembers = members.map((member) => normalizeMember(member));
  }

  if (
    !groupName ||
    !chairpersonName ||
    !chairpersonPhone ||
    !recordKeeperName ||
    !recordKeeperPhone ||
    registrationAmount === undefined ||
    !registrationDate ||
    !trainingDate ||
    !meetingDate ||
    !meetingTime ||
    !groupLocation ||
    (numberOfMembers === undefined && normalizedMembers.length === 0)
  ) {
    res.status(400);
    throw new Error('All group fields are required');
  }

  const finalMemberCount =
    normalizedMembers.length > 0 ? normalizedMembers.length : Number(numberOfMembers);

  const existing = await Group.findOne({
    groupName: String(groupName || '').trim(),
    groupLocation: String(groupLocation || '').trim(),
    chairpersonPhone: String(chairpersonPhone || '').trim(),
    createdByEmail: req.user?.email,
  });
  if (existing) {
    return res.status(200).json(existing);
  }

  const group = await Group.create({
    groupName,
    chairpersonName,
    chairpersonPhone,
    recordKeeperName,
    recordKeeperPhone,
    registrationAmount,
    registrationDate,
    trainingDate,
    meetingDate,
    meetingTime,
    groupLocation,
    district: district || '',
    county: county || '',
    numberOfMembers: finalMemberCount,
    members: normalizedMembers,
    createdBy: req.user?.id,
    createdByEmail: req.user?.email,
  });

  res.status(201).json(group);
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }
  ensureGroupAccess(req, group);

  const fields = [
    'groupName',
    'chairpersonName',
    'chairpersonPhone',
    'recordKeeperName',
    'recordKeeperPhone',
    'registrationAmount',
    'registrationDate',
    'trainingDate',
    'meetingDate',
    'meetingTime',
    'groupLocation',
    'district',
    'county',
    'status',
    'visited',
  ];

  if (req.body.members !== undefined) {
    const memberError = validateMembers(req.body.members);
    if (memberError) {
      res.status(400);
      throw new Error(memberError);
    }
    group.members = req.body.members.map((member) => normalizeMember(member));
    group.numberOfMembers = group.members.length;
  } else if (req.body.numberOfMembers !== undefined) {
    group.numberOfMembers = req.body.numberOfMembers;
  }

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      group[field] = req.body[field];
    }
  });

  await group.save();
  res.json(group);
});

const getGroupMembers = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).select('groupName members numberOfMembers createdByEmail');
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  ensureGroupAccess(req, group);

  res.json({
    groupId: group._id,
    groupName: group.groupName,
    numberOfMembers: group.numberOfMembers,
    members: group.members || [],
  });
});

const addGroupMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  ensureGroupAccess(req, group);

  const memberError = validateMembers([req.body]);
  if (memberError) {
    res.status(400);
    throw new Error(memberError);
  }

  const member = normalizeMember(req.body);
  group.members.push(member);
  group.numberOfMembers = group.members.length;

  await group.save();
  res.status(201).json(group);
});

const getGroupStats = asyncHandler(async (req, res) => {
  const filter = canAccessAllRecords(req) ? {} : { createdByEmail: req.user?.email };
  const qFilter = canAccessAllRecords(req) ? {} : { createdByEmail: req.user?.email };

  const [groups, questionnaires] = await Promise.all([
    Group.find(filter).select(
      'status members visited groupLocation district county trainingDate createdAt'
    ),
    Questionnaire.find(qFilter).select('group status'),
  ]);

  const now = new Date();

  let totalMembers = 0;
  let chairpersons = 0;
  let recordKeepers = 0;
  const communities = new Set();
  const districts = new Set();
  const counties = new Set();

  let visitedGroups = 0;
  let approvedGroups = 0;
  let rejectedGroups = 0;
  let pendingGroups = 0;
  let groupsPlanningForTraining = 0;

  groups.forEach((g) => {
    const status = String(g.status || '').toLowerCase();
    if (g.visited) visitedGroups += 1;
    if (status === 'approved') approvedGroups += 1;
    if (status === 'rejected') rejectedGroups += 1;
    if (status === 'pending') pendingGroups += 1;
    if (g.trainingDate && new Date(g.trainingDate) > now) groupsPlanningForTraining += 1;

    if (g.groupLocation) communities.add(String(g.groupLocation).trim().toLowerCase());
    if (g.district) districts.add(String(g.district).trim().toLowerCase());
    if (g.county) counties.add(String(g.county).trim().toLowerCase());

    const members = Array.isArray(g.members) ? g.members : [];
    totalMembers += members.length;
    members.forEach((m) => {
      const pos = String(m.position || '').trim().toLowerCase();
      if (pos === 'chairperson') chairpersons += 1;
      if (pos === 'record keeper') recordKeepers += 1;
    });
  });

  const groupIdsWithQuestionnaire = new Set(
    questionnaires.map((q) => String(q.group))
  );
  const groupsPlanningForQuestions = groups.filter(
    (g) => String(g.status || '').toLowerCase() === 'approved' &&
      !groupIdsWithQuestionnaire.has(String(g._id))
  ).length;

  res.json({
    totalGroups: groups.length,
    visitedGroups,
    groupsRegistered: groups.length,
    groupsQuestionnaires: questionnaires.length,
    groupsPlanningForQuestions,
    approvedGroups,
    rejectedGroups,
    pendingGroups,
    numberOfGroupMembers: totalMembers,
    numberOfChairpersons: chairpersons,
    numberOfRecordKeepers: recordKeepers,
    numberOfCommunities: communities.size,
    numberOfDistricts: districts.size,
    numberOfCounties: counties.size,
    groupsPlanningForTraining,
  });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }
  ensureGroupAccess(req, group);
  await Group.findByIdAndDelete(req.params.id);
  res.json({ message: 'Group deleted successfully' });
});

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  getGroupStats,
  getGroupMembers,
  addGroupMember,
  deleteGroup,
};
