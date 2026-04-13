const { sanitizeUser } = require('../services/userService');

const allowedProfileFields = [
  'name',
  'sex',
  'height',
  'weight',
  'stepsGoal',
  'lastPeriodDay',
  'periodDuration',
  'cycleLength',
  'onboardingCompleted',
];

const getProfile = async (req, res, next) => {
  try {
    const user = await req.database.findUserById(req.userId);
    res.json({
      success: true,
      message: 'Profile fetched successfully.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updates = {};

    for (const field of allowedProfileFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    const user = await req.database.updateUser(req.userId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const currentUser = await req.database.findUserById(req.userId);
    const settings = {
      ...(currentUser.settings || {}),
      ...(req.body || {}),
    };

    const user = await req.database.updateUser(req.userId, { settings });

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const getAppState = async (req, res, next) => {
  try {
    const state = await req.database.getAppState(req.userId);
    res.json({
      success: true,
      message: 'App state fetched successfully.',
      data: state || {},
    });
  } catch (error) {
    next(error);
  }
};

const saveAppState = async (req, res, next) => {
  try {
    const state = await req.database.saveAppState(req.userId, req.body || {});

    res.json({
      success: true,
      message: 'App state saved successfully.',
      data: state,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  getAppState,
  saveAppState,
};
