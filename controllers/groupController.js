const asyncHandler = require('express-async-handler');
const Group = require('../models/Group');
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

const canAccessAllRecords = (req) => ['admin', 'manager'].includes(String(req.user?.role || '').trim().toLowerCase());

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
    chairpersonPhone,
    recordKeeperPhone,
    registrationAmount,
    registrationDate,
    trainingDate,
    groupLocation,
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
    !chairpersonPhone ||
    !recordKeeperPhone ||
    registrationAmount === undefined ||
    !registrationDate ||
    !trainingDate ||
    !groupLocation ||
    (numberOfMembers === undefined && normalizedMembers.length === 0)
  ) {
    res.status(400);
    throw new Error('All group fields are required');
  }

  const finalMemberCount =
    normalizedMembers.length > 0 ? normalizedMembers.length : Number(numberOfMembers);

  const group = await Group.create({
    groupName,
    chairpersonPhone,
    recordKeeperPhone,
    registrationAmount,
    registrationDate,
    trainingDate,
    groupLocation,
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
    'chairpersonPhone',
    'recordKeeperPhone',
    'registrationAmount',
    'registrationDate',
    'trainingDate',
    'groupLocation',
    'status',
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
  const group = await Group.findById(req.params.id).select('groupName members numberOfMembers');
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
  getGroupMembers,
  addGroupMember,
  deleteGroup,
};
