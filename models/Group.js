const mongoose = require('mongoose');
const { MEMBER_GENDERS, MEMBER_POSITIONS } = require('../config/groupMembers');

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
      enum: MEMBER_POSITIONS,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
      enum: MEMBER_GENDERS,
    },
    signature: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    chairpersonName: {
      type: String,
      required: true,
      trim: true,
    },
    chairpersonPhone: {
      type: String,
      required: true,
      trim: true,
    },
    recordKeeperName: {
      type: String,
      required: true,
      trim: true,
    },
    recordKeeperPhone: {
      type: String,
      required: true,
      trim: true,
    },
    registrationAmount: {
      type: Number,
      required: true,
    },
    registrationDate: {
      type: Date,
      required: true,
    },
    trainingDate: {
      type: Date,
      required: true,
    },
    meetingDate: {
      type: Date,
      required: true,
    },
    meetingTime: {
      type: String,
      required: true,
      trim: true,
    },
    groupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfMembers: {
      type: Number,
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    status: {
      type: String,
      default: 'pending',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByEmail: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
