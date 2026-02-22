const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const register = asyncHandler(async (req, res) => {
  const { username, email, password, role, organization, branch, branchCode } = req.body;

  if (!username || !email || !password || !organization || !branch || !branchCode) {
    res.status(400);
    throw new Error('username, email, password, organization, branch, and branchCode are required');
  }

  const normalizedEmail = normalizeEmail(email);

  const existingByEmail = await User.findOne({ email: normalizedEmail, branchCode });
  if (existingByEmail) {
    res.status(400);
    throw new Error('User with this email already exists in this branch');
  }

  const existingByUsername = await User.findOne({ username, branchCode });
  if (existingByUsername) {
    res.status(400);
    throw new Error('Username already exists in this branch');
  }

  const user = await User.create({
    username,
    email: normalizedEmail,
    password: hashPassword(password),
    role,
    organization,
    branch,
    branchCode,
  });

  res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    organization: user.organization,
    branch: user.branch,
    branchCode: user.branchCode,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('email and password are required');
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(400);
    throw new Error('Invalid credentials');
  }

  const isMatch = comparePassword(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid credentials');
  }

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    organization: user.organization,
    branch: user.branch,
    branchCode: user.branchCode,
  });
});

module.exports = { register, login };
