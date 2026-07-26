import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Lock, User, Zap } from 'lucide-react';

export default function Login() {
  const { login } = useSocket();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username || !password) {
      setError('Please fill in all credentials fields');
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected login error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Stadium Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-ipl-gold/[0.04] via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-gradient-radial from-ipl-blue/[0.03] via-transparent to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-gradient-radial from-ipl-purple/[0.03] via-transparent to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Cricket Stump Decorative Lines */}
      <div className="absolute inset-0 cricket-stump-pattern opacity-30 pointer-events-none"></div>

      {/* Floating Cricket Elements */}
      <div className="absolute top-[15%] left-[10%] text-4xl opacity-[0.04] animate-float select-none pointer-events-none">🏏</div>
      <div className="absolute top-[25%] right-[15%] text-3xl opacity-[0.04] animate-float select-none pointer-events-none" style={{ animationDelay: '1s' }}>🏆</div>
      <div className="absolute bottom-[20%] left-[20%] text-3xl opacity-[0.04] animate-float select-none pointer-events-none" style={{ animationDelay: '2s' }}>⚡</div>
      <div className="absolute bottom-[30%] right-[10%] text-4xl opacity-[0.04] animate-float select-none pointer-events-none" style={{ animationDelay: '0.5s' }}>🎯</div>

      {/* Main Login Card */}
      <div className="glassmorphism-gold rounded-3xl max-w-md w-full p-8 relative z-10 overflow-hidden animate-scale-in">
        {/* Top Gold Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-ipl-gold/10 border border-ipl-gold/30 p-4 rounded-2xl mb-4 shadow-gold-glow relative">
            <div className="absolute inset-0 bg-ipl-gold/5 rounded-2xl blur-xl"></div>
            <CricketBatIcon className="w-10 h-10 text-ipl-goldLight relative z-10" />
          </div>
          <h1 className="text-2xl font-black title-font uppercase tracking-wider gold-text-gradient leading-tight">
            IPL MEGA AUCTION
          </h1>
          <p className="text-[10px] text-ipl-gray uppercase tracking-[0.3em] mt-1.5 font-semibold">
            Live Auction Simulator • 2026
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-ipl-red text-xs font-semibold rounded-xl p-3 text-center mb-5 animate-slide-down">
            <span className="mr-1">⚠️</span> {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-ipl-gray uppercase font-black tracking-widest block">
              Username
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-ipl-gray/50 group-focus-within:text-ipl-gold transition-colors">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-ipl-dark/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:border-ipl-gold/60 focus:ring-1 focus:ring-ipl-gold/30 focus:bg-ipl-dark transition duration-300"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-ipl-gray uppercase font-black tracking-widest block">
              Password
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-ipl-gray/50 group-focus-within:text-ipl-gold transition-colors">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-ipl-dark/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:border-ipl-gold/60 focus:ring-1 focus:ring-ipl-gold/30 focus:bg-ipl-dark transition duration-300"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 gold-gradient text-ipl-dark font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-gold-glow-large disabled:opacity-50 transition-all duration-300 flex justify-center items-center gap-2 group"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-ipl-dark border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                <span>Enter Auction Arena</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <p className="text-[9px] text-ipl-gray/60 uppercase tracking-widest">
            Contact your event organizer for access credentials
          </p>
        </div>
      </div>
    </div>
  );
}

// Cricket bat SVG icon
function CricketBatIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
    </svg>
  );
}
