const jwt = require('jsonwebtoken');
const config = require('../config');
const { AdminUser } = require('../models');
const { HttpError } = require('../lib/errors');

const COOKIE = 'wf_admin';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.isProd,
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

function signAdminToken(admin) {
  return jwt.sign({ sub: String(admin._id) }, config.jwtSecret, { expiresIn: '8h' });
}

async function requireAdmin(req, _res, next) {
  try {
    const token = req.cookies && req.cookies[COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in.');
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new HttpError(401, 'Your session has expired. Please sign in again.');
    }
    const admin = await AdminUser.findById(payload.sub).select('email name');
    if (!admin) throw new HttpError(401, 'Please sign in.');
    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...err.extra });
  if (err.name === 'MulterError') return res.status(422).json({ message: `Upload problem: ${err.message}` });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier.' });
  if (err.name === 'ValidationError') return res.status(422).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}

module.exports = { COOKIE, cookieOptions, signAdminToken, requireAdmin, asyncHandler, errorHandler };
