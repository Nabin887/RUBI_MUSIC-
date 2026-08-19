import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key';

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