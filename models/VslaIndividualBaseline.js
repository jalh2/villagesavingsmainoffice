const mongoose = require('mongoose');

const vslaIndividualBaselineSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    vslaName: {
      type: String,
      required: true,
      trim: true,
    },
    vslaCode: {
      type: String,
      trim: true,
    },
    communityTownOfMember: {
      type: String,
      trim: true,
    },
    county: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    membershipId: {
      type: String,
      trim: true,
    },
    telephoneNumber: {
      type: String,
      trim: true,
    },
    genderSex: {
      type: String,
      trim: true,
    },
    numberOfDependents: {
      type: Number,
    },
    maritalStatus: {
      type: String,
      trim: true,
    },
    educationLevel: {
      type: String,
      trim: true,
    },
    primaryOccupation: {
      type: String,
      trim: true,
    },
    secondaryOccupation: {
      type: String,
      trim: true,
    },
    monthlyIncome: {
      type: Number,
    },
    firstYearOfMembership: {
      type: Number,
    },
    totalSavingsPerYear: {
      type: Number,
    },
    borrowed: {
      type: String,
      trim: true,
      enum: ['yes', 'no'],
      default: 'no',
    },
    loanAmount: {
      type: Number,
    },
    purposeOfLoan: {
      type: String,
      trim: true,
    },
    loanStatus: {
      type: String,
      trim: true,
    },
    attendanceRate: {
      type: Number,
    },
    phoneOwnership: {
      type: String,
      trim: true,
    },
    smartphoneDigitalLiteracy: {
      type: String,
      trim: true,
    },
    mobileMoneyUse: {
      type: String,
      trim: true,
    },
    mnoCompany: {
      type: String,
      trim: true,
    },
    vulnerableGroup: {
      type: String,
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

vslaIndividualBaselineSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('VslaIndividualBaseline', vslaIndividualBaselineSchema);
