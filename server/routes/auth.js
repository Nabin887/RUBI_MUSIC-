import express from 'express';
import passport from 'passport';
import {
  signup,
  login,
  refreshToken,
  logout,
  oauthCallback,
  me,
  updateMe,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', me);
router.patch('/me', updateMe);

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth/fail' }),
  oauthCallback
);

router.get('/oauth/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get(
  '/oauth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/api/auth/oauth/fail' }),
  oauthCallback
);

router.get('/oauth/fail', (_req, res) => {
  res.status(401).json({ message: 'OAuth login failed' });
});

export default router;
