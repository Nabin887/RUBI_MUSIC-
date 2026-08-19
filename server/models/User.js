
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, default: 'user' },
    favorites: [{ type: String }],
    history: [{ type: String }],
    oauth: {
      provider: { type: String },
      id: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
