import React, { useState } from 'react';
import { post } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
    onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
        const res = await post('/auth/login', { email, password });
        if (res.accessToken) {
          login(res.user, res.accessToken);
        } else {
          setMsg(res.message || 'Error logging in');
        }
    } catch (err) {
        setMsg('Connection error');
    } finally {
        setLoading(false);
    }
  }

  const handleOAuth = (provider: string) => {
      window.location.href = `http://localhost:4000/api/auth/oauth/${provider}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 relative overflow-hidden font-sans text-white">
       {/* Background Effects */}
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
       <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

       <div className="p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 border border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="text-center mb-8">
              <h1 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">RUBI</h1>
              <p className="text-zinc-400">Login to continue your vibe.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input 
                className="p-4 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={email} 
                onChange={e=>setEmail(e.target.value)}
                placeholder="Email address" 
                type="email"
                required
            />
            <input 
                className="p-4 bg-zinc-800/50 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                placeholder="Password" 
                type="password"
                required
            />
            
            {msg && <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded">{msg}</p>}

            <button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
                {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-zinc-500 text-xs uppercase font-bold">Or continue with</span>
              <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOAuth('google')} className="p-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition">
                 Google
              </button>
              <button onClick={() => handleOAuth('github')} className="p-3 bg-[#24292e] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black transition border border-white/20">
                 GitHub
              </button>
          </div>

          <div className="mt-8 text-center">
              <p className="text-zinc-400 text-sm">
                  Don't have an account?{' '}
                  <button onClick={onSwitchToSignup} className="text-emerald-400 font-bold hover:underline">
                      Sign up
                  </button>
              </p>
          </div>
       </div>
    </div>
  );
}

export default LoginPage;
