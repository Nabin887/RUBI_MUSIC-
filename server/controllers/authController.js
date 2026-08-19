import bcrypt from 'bcrypt';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

function readBearerToken(req) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    return auth.slice(7);
}

async function getUserFromAccessToken(req) {
    const token = readBearerToken(req);
    if (!token) return null;
    const payload = verifyAccessToken(token);
    return User.findById(payload.sub);
}

export async function signup(req, res) {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    if (password.length < 8) return res.status(400).json({ message: 'Password too weak' });

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({ email, passwordHash, name, role: 'user' });

        const access = signAccessToken(user);
        const refresh = signRefreshToken(user);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await RefreshToken.create({ token: refresh, user: user._id, expiresAt });

        res.cookie('refreshToken', refresh, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        return res.json({ 
            accessToken: access, 
            user: { id: user._id, email: user.email, name: user.name, role: user.role } 
        });
    } catch (err) {
        return res.status(500).json({ message: 'Signup error', error: err.message });
    }
}

export async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    try {
        const user = await User.findOne({ email });
        if (!user || !user.passwordHash) return res.status(400).json({ message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

        const access = signAccessToken(user);
        const refresh = signRefreshToken(user);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await RefreshToken.create({ token: refresh, user: user._id, expiresAt });

        res.cookie('refreshToken', refresh, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        return res.json({ 
            accessToken: access, 
            user: { id: user._id, email: user.email, name: user.name, role: user.role } 
        });
    } catch (err) {
        return res.status(500).json({ message: 'Login error', error: err.message });
    }
}

export async function refreshToken(req, res) {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ message: 'Missing refresh token' });

        const payload = verifyRefreshToken(token);
        const saved = await RefreshToken.findOne({ token });
        if (!saved) return res.status(401).json({ message: 'Invalid refresh token' });

        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ message: 'User not found' });

        const newAccess = signAccessToken(user);
        const newRefresh = signRefreshToken(user);

        saved.token = newRefresh;
        saved.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await saved.save();

        res.cookie('refreshToken', newRefresh, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        return res.json({ accessToken: newAccess });
    } catch (err) {
        return res.status(401).json({ message: 'Invalid refresh token', error: err.message });
    }
}

export async function logout(req, res) {
    try {
        const token = req.cookies.refreshToken;
        res.clearCookie('refreshToken');
        if (token) await RefreshToken.deleteOne({ token });
        return res.json({ message: 'Logged out' });
    } catch (err) {
        return res.status(500).json({ message: 'Logout error', error: err.message });
    }
}

export async function oauthCallback(req, res) {
    try {
        const user = req.user;
        const access = signAccessToken(user);
        const refresh = signRefreshToken(user);
        
        await RefreshToken.create({ 
            token: refresh, 
            user: user._id, 
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        });

        res.cookie('refreshToken', refresh, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax' 
        });

        // Redirect back to frontend with token in query param
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?token=${access}`);
    } catch (err) {
        return res.status(500).json({ message: 'OAuth callback error', error: err.message });
    }
}

export async function me(req, res) {
    try {
        const user = await getUserFromAccessToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        return res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar || '',
                role: user.role,
            },
        });
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized', error: err.message });
    }
}

export async function updateMe(req, res) {
    try {
        const user = await getUserFromAccessToken(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { name, avatar } = req.body || {};
        if (typeof name === 'string') user.name = name.trim() || user.name;
        if (typeof avatar === 'string') user.avatar = avatar;
        await user.save();

        return res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar || '',
                role: user.role,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Profile update failed', error: err.message });
    }
}
