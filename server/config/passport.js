import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: '/api/auth/oauth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ email });
        
        if (!user) {
            user = await User.create({
                email,
                name: profile.displayName,
                oauth: { provider: 'google', id: profile.id },
            });
        } else if (!user.oauth?.id) {
            user.oauth = { provider: 'google', id: profile.id };
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: '/api/auth/oauth/github/callback',
    scope: ['user:email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ email });
        
        if (!user) {
            user = await User.create({
                email,
                name: profile.displayName || profile.username,
                oauth: { provider: 'github', id: profile.id },
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));