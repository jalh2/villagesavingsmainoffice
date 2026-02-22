require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Group = require('../models/Group');
const Questionnaire = require('../models/Questionnaire');
const { hashPassword } = require('../utils/password');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI (or MONGO_URI) in environment variables');
}

const DEFAULT_PASSWORD = 'password123';
const ORG = 'Village Savings';
const BRANCH = 'Main Office';
const BRANCH_CODE = 'MO-001';

const userSeeds = [
  {
    username: 'admin.mainoffice',
    email: 'admin@villagesavings.local',
    role: 'admin',
  },
  {
    username: 'manager.mainoffice',
    email: 'manager@villagesavings.local',
    role: 'manager',
  },
  {
    username: 'staff.mainoffice',
    email: 'staff@villagesavings.local',
    role: 'staff',
  },
  {
    username: 'assets.mainoffice',
    email: 'assets@villagesavings.local',
    role: 'assets',
  },
  {
    username: 'fieldagent.mainoffice',
    email: 'fieldagent@villagesavings.local',
    role: 'field agent',
  },
];

const groupSeeds = [
  {
    groupName: 'Hope Savers',
    chairpersonPhone: '+256700000001',
    recordKeeperPhone: '+256700000002',
    registrationAmount: 50000,
    registrationDate: '2026-01-15T00:00:00.000Z',
    trainingDate: '2026-01-25T00:00:00.000Z',
    groupLocation: 'Kampala',
    numberOfMembers: 28,
    status: 'pending',
    createdByEmail: 'fieldagent@villagesavings.local',
  },
  {
    groupName: 'Unity Women VSLA',
    chairpersonPhone: '+256700000003',
    recordKeeperPhone: '+256700000004',
    registrationAmount: 65000,
    registrationDate: '2026-01-10T00:00:00.000Z',
    trainingDate: '2026-01-20T00:00:00.000Z',
    groupLocation: 'Wakiso',
    numberOfMembers: 35,
    status: 'approved',
    createdByEmail: 'staff@villagesavings.local',
  },
  {
    groupName: 'Progress Farmers Circle',
    chairpersonPhone: '+256700000005',
    recordKeeperPhone: '+256700000006',
    registrationAmount: 40000,
    registrationDate: '2026-02-01T00:00:00.000Z',
    trainingDate: '2026-02-11T00:00:00.000Z',
    groupLocation: 'Mukono',
    numberOfMembers: 22,
    status: 'rejected',
    createdByEmail: 'fieldagent@villagesavings.local',
  },
];

const questionnaireSeeds = [
  {
    groupName: 'Hope Savers',
    status: 'pending',
    organizationType: 'VSLA',
    county: 'Kampala Central',
    servicesOffered: ['Savings', 'Emergency Loans'],
    trainingReceived: ['Financial Literacy', 'Leadership'],
    leadershipPositionsCount: 5,
    maleLeadersCount: 2,
    femaleLeadersCount: 3,
    governancePolicies: 'Basic written policies in place',
    loanRepaymentRate: '92%',
    recordkeepingMethod: 'Manual ledger',
    notes: 'Awaiting review from main office.',
    createdByEmail: 'fieldagent@villagesavings.local',
  },
  {
    groupName: 'Unity Women VSLA',
    status: 'approved',
    organizationType: 'CU',
    county: 'Wakiso',
    servicesOffered: ['Savings', 'Loans', 'Insurance referrals'],
    trainingReceived: ['Governance', 'Digital literacy'],
    leadershipPositionsCount: 7,
    maleLeadersCount: 1,
    femaleLeadersCount: 6,
    governancePolicies: 'Constitution and bylaws available',
    loanRepaymentRate: '97%',
    recordkeepingMethod: 'Hybrid (paper + spreadsheet)',
    notes: 'Strong governance and repayment performance.',
    createdByEmail: 'staff@villagesavings.local',
  },
  {
    groupName: 'Progress Farmers Circle',
    status: 'rejected',
    organizationType: 'VSLA',
    county: 'Mukono',
    servicesOffered: ['Savings'],
    trainingReceived: ['None'],
    leadershipPositionsCount: 3,
    maleLeadersCount: 3,
    femaleLeadersCount: 0,
    governancePolicies: 'No formal policies submitted',
    loanRepaymentRate: '61%',
    recordkeepingMethod: 'Informal notebook',
    notes: 'Returned for rework due to incomplete governance details.',
    createdByEmail: 'fieldagent@villagesavings.local',
  },
];

const shouldClear = !process.argv.includes('--no-clear');

async function seed() {
  await mongoose.connect(MONGODB_URI);

  if (shouldClear) {
    await Questionnaire.deleteMany({});
    await Group.deleteMany({});
    await User.deleteMany({});
  } else {
    // Keep non-seed data, but refresh the known seed records to keep reruns stable.
    await Questionnaire.deleteMany({ groupName: { $in: questionnaireSeeds.map((q) => q.groupName) } });
    await Group.deleteMany({ groupName: { $in: groupSeeds.map((g) => g.groupName) } });
    await User.deleteMany({ email: { $in: userSeeds.map((u) => u.email) }, branchCode: BRANCH_CODE });
  }

  const users = await User.insertMany(
    userSeeds.map((u) => ({
      ...u,
      password: hashPassword(DEFAULT_PASSWORD),
      organization: ORG,
      branch: BRANCH,
      branchCode: BRANCH_CODE,
    }))
  );

  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  const groups = await Group.insertMany(
    groupSeeds.map((g) => {
      const creator = userByEmail[g.createdByEmail];
      return {
        groupName: g.groupName,
        chairpersonPhone: g.chairpersonPhone,
        recordKeeperPhone: g.recordKeeperPhone,
        registrationAmount: g.registrationAmount,
        registrationDate: g.registrationDate,
        trainingDate: g.trainingDate,
        groupLocation: g.groupLocation,
        numberOfMembers: g.numberOfMembers,
        status: g.status,
        createdBy: creator?._id,
        createdByEmail: creator?.email,
      };
    })
  );

  const groupByName = Object.fromEntries(groups.map((g) => [g.groupName, g]));

  await Questionnaire.insertMany(
    questionnaireSeeds.map((q) => {
      const creator = userByEmail[q.createdByEmail];
      const group = groupByName[q.groupName];
      return {
        group: group._id,
        groupName: group.groupName,
        status: q.status,
        organizationType: q.organizationType,
        county: q.county,
        servicesOffered: q.servicesOffered,
        trainingReceived: q.trainingReceived,
        leadershipPositionsCount: q.leadershipPositionsCount,
        maleLeadersCount: q.maleLeadersCount,
        femaleLeadersCount: q.femaleLeadersCount,
        governancePolicies: q.governancePolicies,
        loanRepaymentRate: q.loanRepaymentRate,
        recordkeepingMethod: q.recordkeepingMethod,
        notes: q.notes,
        createdBy: creator?._id,
        createdByEmail: creator?.email,
      };
    })
  );

  console.log('Seed complete.');
  console.log('--- Test users (all use password: Password123!) ---');
  userSeeds.forEach((u) => {
    console.log(`- ${u.role}: ${u.email}`);
  });
  console.log('--- Records ---');
  console.log(`Users: ${userSeeds.length}`);
  console.log(`Groups: ${groupSeeds.length}`);
  console.log(`Questionnaires: ${questionnaireSeeds.length}`);
}

async function run() {
  try {
    await seed();
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
