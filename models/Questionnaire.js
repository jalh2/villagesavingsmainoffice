const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    organizationType: String,
    groupName: String,
    county: String,
    servicesOffered: [String],
    trainingReceived: [String],
    leadershipPositionsCount: Number,
    maleLeadersCount: Number,
    femaleLeadersCount: Number,
    leadershipElectionFrequency: String,
    leadershipResponsibilities: [String],
    governancePolicies: String,
    externalSupervision: String,
    bylaws: String,
    conflictResolutionMechanisms: [String],
    cyclesCompleted: Number,
    currentCycleProgress: String,
    shareOutPeriodMonths: String,
    dividendDistributionFrequency: String,
    avgMemberContributionPerCycle: Number,
    totalSavingsPerCycle: Number,
    loanDurationMonths: String,
    avgLoanSizePerCycle: Number,
    loanRepaymentFrequency: String,
    loanRepaymentRate: String,
    loanDefaultRate: String,
    interestRateOnLoans: String,
    avgIdleFundPerMonth: Number,
    idleFundHoldingPeriod: String,
    idleFundReason: String,
    savingsIncentives: [String],
    formalBankAccount: String,
    externalFundingAccess: String,
    membersReceivedLoansPercent: String,
    membershipGrowthTrend: String,
    recordkeepingMethod: String,
    deviceOwnership: String,
    internetAccess: String,
    digitalLiteracyLevel: String,
    trainingOnDigitalTools: String,
    communicationToolsUsed: [String],
    purposeOfMobileMoney: [String],
    notes: String,
    status: {
      type: String,
      default: 'pending',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByEmail: String,
  },
  { timestamps: true }
);

questionnaireSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('Questionnaire', questionnaireSchema);
