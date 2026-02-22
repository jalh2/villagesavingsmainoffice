const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

const createUser = asyncHandler(async (req, res) => {
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

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { username, email, role, organization, branch, branchCode } = req.body;
  const nextBranchCode = branchCode || user.branchCode;

  if (email && normalizeEmail(email) !== user.email) {
    const existingByEmail = await User.findOne({ email: normalizeEmail(email), branchCode: nextBranchCode });
    if (existingByEmail) {
      res.status(400);
      throw new Error('User with this email already exists in this branch');
    }
    user.email = normalizeEmail(email);
  }

  if (username && username !== user.username) {
    const existingByUsername = await User.findOne({ username, branchCode: nextBranchCode });
    if (existingByUsername) {
      res.status(400);
      throw new Error('Username already exists in this branch');
    }
    user.username = username;
  }

  if (role) user.role = role;
  if (organization) user.organization = organization;
  if (branch) user.branch = branch;
  if (branchCode) user.branchCode = branchCode;

  await user.save();

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

const changePassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.status(400);
    throw new Error('password is required');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.password = hashPassword(password);
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted successfully' });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
};
