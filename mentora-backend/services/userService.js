const bcrypt = require('bcryptjs');
const dns = require('dns').promises;

const validateEmail = (email) => /\S+@\S+\.\S+/.test(String(email || '').trim());

const validateEmailDomain = async (email) => {
  const domain = String(email || '').split('@')[1];

  if (!domain) {
    return false;
  }

  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch (error) {
    if (['ENOTFOUND', 'ENODATA', 'EBADNAME'].includes(error.code)) {
      return false;
    }

    return true;
  }
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const plain = typeof user.toObject === 'function' ? user.toObject() : user;
  const { password, _id, __v, ...safe } = plain;
  return {
    id: plain.id || String(_id || safe.id),
    ...safe,
  };
};

const assertRegistrationPayload = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  const hasValidEmailDomain = await validateEmailDomain(email);
  if (!hasValidEmailDomain) {
    const error = new Error('This email domain does not appear to accept real email.');
    error.statusCode = 400;
    throw error;
  }

  if (String(password).length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }
};

const buildProfileFromPayload = (payload = {}) => ({
  name: payload.name,
  email: String(payload.email).toLowerCase(),
  password: payload.password,
  role: payload.role || 'user',
  sex: payload.sex || '',
  height: Number(payload.height) || 165,
  weight: Number(payload.weight) || 65,
  stepsGoal: Number(payload.stepsGoal) || 8000,
  lastPeriodDay: payload.lastPeriodDay || null,
  periodDuration: Number(payload.periodDuration) || 5,
  cycleLength: Number(payload.cycleLength) || 28,
  onboardingCompleted: payload.onboardingCompleted ?? false,
  settings: {
    notifications: payload.settings?.notifications ?? true,
    soundEnabled: payload.settings?.soundEnabled ?? true,
    vibrationEnabled: payload.settings?.vibrationEnabled ?? true,
    dataSync: payload.settings?.dataSync ?? true,
    privacyMode: payload.settings?.privacyMode ?? true,
  },
});

const createUser = async (database, payload) => {
  await assertRegistrationPayload(payload);
  const existingUser = await database.findUserByEmail(payload.email);

  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const password = await bcrypt.hash(payload.password, 10);
  const user = await database.createUser({
    ...buildProfileFromPayload(payload),
    password,
  });

  return sanitizeUser(user);
};

const authenticateUser = async (database, email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const user = await database.findUserByEmail(email);

  if (!user || !user.password || typeof user.password !== 'string') {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  return sanitizeUser(user);
};

module.exports = {
  sanitizeUser,
  createUser,
  authenticateUser,
};
