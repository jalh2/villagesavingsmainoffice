const asyncHandler = require('express-async-handler');
const VslaIndividualBaseline = require('../models/VslaIndividualBaseline');
const Group = require('../models/Group');

const asTrimmed = (value) => String(value || '').trim();

const normalizeBorrowed = (value) => {
  const normalized = asTrimmed(value).toLowerCase();
  if (normalized === 'yes') return 'yes';
  if (normalized === 'no') return 'no';
  return undefined;
};

const toNumberOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const baselineFields = [
  'vslaName',
  'vslaCode',
  'communityTownOfMember',
  'county',
  'district',
  'fullName',
  'membershipId',
  'telephoneNumber',
  'genderSex',
  'numberOfDependents',
  'maritalStatus',
  'educationLevel',
  'primaryOccupation',
  'secondaryOccupation',
  'monthlyIncome',
  'firstYearOfMembership',
  'totalSavingsPerYear',
  'borrowed',
  'loanAmount',
  'purposeOfLoan',
  'loanStatus',
  'attendanceRate',
  'phoneOwnership',
  'smartphoneDigitalLiteracy',
  'mobileMoneyUse',
  'mnoCompany',
  'vulnerableGroup',
];

const numberFields = [
  'numberOfDependents',
  'monthlyIncome',
  'firstYearOfMembership',
  'totalSavingsPerYear',
  'loanAmount',
  'attendanceRate',
];

const getMemberById = (group, memberId) => {
  if (!memberId || !Array.isArray(group?.members)) return null;
  const id = asTrimmed(memberId);
  return group.members.find((member) => member?._id && member._id.toString() === id) || null;
};

const applyMemberDefaults = (payload, member) => {
  if (!member) return;
  if (!asTrimmed(payload.fullName)) payload.fullName = asTrimmed(member.name);
  if (!asTrimmed(payload.telephoneNumber)) payload.telephoneNumber = asTrimmed(member.contact);
  if (!asTrimmed(payload.genderSex)) payload.genderSex = asTrimmed(member.gender);
};

const buildPayload = (body) => {
  const payload = {};

  baselineFields.forEach((field) => {
    if (body[field] === undefined) return;

    if (numberFields.includes(field)) {
      const value = toNumberOrUndefined(body[field]);
      if (value !== undefined) payload[field] = value;
      return;
    }

    if (field === 'borrowed') {
      const value = normalizeBorrowed(body[field]);
      if (value !== undefined) payload[field] = value;
      return;
    }

    const value = asTrimmed(body[field]);
    if (value) payload[field] = value;
  });

  return payload;
};

const getAllVslaIndividualBaselines = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.groupId) {
    filter.group = req.query.groupId;
  }

  const records = await VslaIndividualBaseline.find(filter)
    .sort({ createdAt: -1 })
    .populate('group', 'groupName')
    .lean();

  res.json(records);
});

const getVslaIndividualBaselineById = asyncHandler(async (req, res) => {
  const record = await VslaIndividualBaseline.findById(req.params.id).populate('group', 'groupName');
  if (!record) {
    res.status(404);
    throw new Error('VSLA individual baseline record not found');
  }
  res.json(record);
});

const createVslaIndividualBaseline = asyncHandler(async (req, res) => {
  const groupId = asTrimmed(req.body.group);
  if (!groupId) {
    res.status(400);
    throw new Error('group is required');
  }

  const group = await Group.findById(groupId).select('groupName groupLocation members');
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  const payload = buildPayload(req.body || {});
  payload.group = group._id;

  const memberId = asTrimmed(req.body.memberId);
  if (memberId) {
    payload.memberId = memberId;
    applyMemberDefaults(payload, getMemberById(group, memberId));
  }

  if (!payload.vslaName) {
    payload.vslaName = asTrimmed(group.groupName);
  }
  if (!payload.communityTownOfMember) {
    payload.communityTownOfMember = asTrimmed(group.groupLocation);
  }

  if (!payload.fullName) {
    res.status(400);
    throw new Error('fullName is required');
  }

  payload.createdBy = req.user?.id;
  payload.createdByEmail = req.user?.email;

  const created = await VslaIndividualBaseline.create(payload);
  res.status(201).json(created);
});

const updateVslaIndividualBaseline = asyncHandler(async (req, res) => {
  const record = await VslaIndividualBaseline.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('VSLA individual baseline record not found');
  }

  let group = null;
  if (req.body.group !== undefined) {
    const groupId = asTrimmed(req.body.group);
    if (!groupId) {
      res.status(400);
      throw new Error('group cannot be empty');
    }
    group = await Group.findById(groupId).select('groupName groupLocation members');
    if (!group) {
      res.status(404);
      throw new Error('Group not found');
    }
    record.group = group._id;
  }

  const payload = buildPayload(req.body || {});

  if (req.body.memberId !== undefined) {
    const memberId = asTrimmed(req.body.memberId);
    if (memberId) {
      payload.memberId = memberId;
      if (!group) {
        group = await Group.findById(record.group).select('groupName groupLocation members');
      }
      applyMemberDefaults(payload, getMemberById(group, memberId));
    }
  }

  Object.keys(payload).forEach((key) => {
    record[key] = payload[key];
  });

  if (!asTrimmed(record.vslaName)) {
    if (!group) group = await Group.findById(record.group).select('groupName');
    record.vslaName = asTrimmed(group?.groupName);
  }

  if (!asTrimmed(record.fullName)) {
    res.status(400);
    throw new Error('fullName is required');
  }

  await record.save();
  res.json(record);
});

const deleteVslaIndividualBaseline = asyncHandler(async (req, res) => {
  const record = await VslaIndividualBaseline.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('VSLA individual baseline record not found');
  }

  await VslaIndividualBaseline.findByIdAndDelete(req.params.id);
  res.json({ message: 'VSLA individual baseline record deleted successfully' });
});

module.exports = {
  getAllVslaIndividualBaselines,
  getVslaIndividualBaselineById,
  createVslaIndividualBaseline,
  updateVslaIndividualBaseline,
  deleteVslaIndividualBaseline,
};
