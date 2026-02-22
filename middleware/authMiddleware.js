const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const identifyUserFromHeader = asyncHandler(async (req, res, next) => {
  const emailHeader = req.header('x-user-email');
  if (!emailHeader) {
    res.status(400);
    throw new Error('User email is required in x-user-email header');
  }
  const email = String(emailHeader).trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found for provided email');
  }
  req.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    username: user.username,
    organization: user.organization,
    branch: user.branch,
    branchCode: user.branchCode,
  };
  next();
});

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not identified');
  }
  const allowed = (roles || []).map((role) => String(role).trim().toLowerCase());
  const userRole = String(req.user.role || '').trim().toLowerCase();
  if (!allowed.includes(userRole)) {
    res.status(403);
    throw new Error('Access denied: insufficient role');
  }
  next();
};

module.exports = { identifyUserFromHeader, authorizeRoles };
