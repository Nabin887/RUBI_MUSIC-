import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'signup';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitLabel = mode === 'login' ? 'Log in' : 'Create account';

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setMessage('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (!result.success) {
          setMessage(result.message || 'Unable to log in.');
        }
        return;
      }

      const result = await signup(name, email, password);
      if (!result.success) {
        setMessage(result.message || 'Unable to create account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,61,100,0.24),transparent_35%),#03060d] text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[360px] rounded-2xl border border-[#1f2a38] bg-[linear-gradient(180deg,#111216_0%,#0e0f14_100%)] p-7 shadow-[0_18px_55px_rgba(0,0,0,0.55)]">
        {mode === 'signup' ? (
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className="mb-4 w-10 h-10 rounded-full border border-[#1d4c78] bg-[#0c2b4a] text-[#9ecbf2] grid place-items-center hover:bg-[#113a63]"
            aria-label="Back to login"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        ) : null}

        <h1 className="text-[48px]/none sm:text-[44px]/none font-extrabold tracking-tight mb-2">Nabify</h1>
        <p className="text-[#9ca3af] text-[28px]/none sm:text-[22px]/none mb-7">
          {mode === 'login' ? 'Log in to continue listening.' : 'Create account to start listening.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-xl bg-[linear-gradient(90deg,#272729,#1f2024)] border border-[#343740] px-4 py-3.5 text-white placeholder:text-[#8c939f] outline-none focus:border-[#1dbf73]"
              required
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl bg-[linear-gradient(90deg,#272729,#1f2024)] border border-[#343740] px-4 py-3.5 text-white placeholder:text-[#8c939f] outline-none focus:border-[#1dbf73]"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-xl bg-[linear-gradient(90deg,#272729,#1f2024)] border border-[#343740] px-4 py-3.5 text-white placeholder:text-[#8c939f] outline-none focus:border-[#1dbf73]"
            required
          />

          {message && (
            <p className="text-[#ffb4c2] text-sm border border-[#6a2d3c] bg-[#2d1119] rounded-xl px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-1 rounded-xl bg-[#1ac38b] text-[#03231a] font-bold py-3.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : submitLabel}
          </button>
        </form>

        <p className="text-center text-[#c2c9d3] text-sm mt-6">
          {mode === 'login' ? 'Need an account? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
            className="text-white font-medium hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
