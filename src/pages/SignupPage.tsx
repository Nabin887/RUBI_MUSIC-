import React, { useState } from 'react';
import { post } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface SignupPageProps {
    onSwitchToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
        const res = await post('/auth/signup', { email, password, name });
        if (res.accessToken) {
          login(res.user, res.accessToken);
        } else {
          setMsg(res.message || 'Error signing up');
        }
    } catch (err) {
        setMsg('Connection error');
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 relative overflow-hidden font-sans text-white">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
       <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

       <div className="p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 border border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="text-center mb-8">
              <h1 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Join RUBI</h1>
              <p className="text-zinc-400">Create an account to start listening.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input 
                className="p-4 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                value={name} 
                onChange={e=>setName(e.target.value)}
                placeholder="Display Name" 
                required
            />
            <input 
                className="p-4 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                value={email} 
                onChange={e=>setEmail(e.target.value)}
                placeholder="Email address" 
                type="email"
                required
            />
            <input 
                className="p-4 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                placeholder="Password (8+ chars)" 
                type="password"
                required
            />
            
            {msg && <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded">{msg}</p>}

            <button 
                type="submit" 
                disabled={loading}
                className="bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-2"
            >
                {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
              <p className="text-zinc-400 text-sm">
                  Already have an account?{' '}
                  <button onClick={onSwitchToLogin} className="text-cyan-400 font-bold hover:underline">
                      Log in
                  </button>
              </p>
          </div>
       </div>
    </div>
  );
}

export default SignupPage;
