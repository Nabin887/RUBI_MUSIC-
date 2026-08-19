import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    replacedBy: { type: String },
}, { timestamps: true });

export default mongoose.model('RefreshToken', RefreshTokenSchema);