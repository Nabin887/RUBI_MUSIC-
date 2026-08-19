import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : crypto.randomBytes(32).toString('hex'));
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (isProduction ? '' : crypto.randomBytes(32).toString('hex'));

if (isProduction && (!JWT_SECRET || !JWT_REFRESH_SECRET)) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be configured in the server environment.');
}

export function signAccessToken(user) {
    return jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: ACCESS_EXPIRES 
    });
}

export function signRefreshToken(user) {
    return jwt.sign({ sub: user._id, type: 'refresh' }, JWT_REFRESH_SECRET, { 
        expiresIn: REFRESH_EXPIRES 
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}
