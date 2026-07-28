import React, { useEffect } from 'react';

export default function SoldOverlay({ soldAnimation, unsoldAnimation, teams = [] }) {
  useEffect(() => {
    if (soldAnimation) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, [soldAnimation]);

  if (!soldAnimation && !unsoldAnimation) return null;

  // Resolve Team Logo with maximum fallback coverage
  const getTeamLogo = () => {
    if (!soldAnimation) return null;
    if (soldAnimation.teamLogo) return soldAnimation.teamLogo;

    const matchedTeam = teams.find(
      (t) =>
        t.teamName?.toLowerCase() === soldAnimation.teamName?.toLowerCase() ||
        t.username?.toLowerCase() === soldAnimation.teamName?.toLowerCase() ||
        t.shortCode?.toLowerCase() === soldAnimation.teamName?.toLowerCase()
    );

    if (matchedTeam && matchedTeam.logo) return matchedTeam.logo;

    // Fallback logo generator based on team name initials
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(soldAnimation.teamName || 'ipl')}&backgroundColor=0b0f19&color=f5c453`;
  };

  return (
    <>
      {/* SOLD CELEBRATION OVERLAY */}
      {soldAnimation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
          {/* Background Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none"></div>

          {/* Card Container */}
          <div className="text-center p-8 md:p-14 bg-gradient-to-b from-ipl-dark via-ipl-darker to-black border-4 border-emerald-500/80 rounded-3xl shadow-[0_0_120px_rgba(16,185,129,0.6)] animate-scale-in w-full max-w-xl relative overflow-hidden">
            
            {/* Animated Glow Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[450px] h-[450px] rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="w-[300px] h-[300px] rounded-full border border-ipl-gold/20 animate-ping" style={{ animationDuration: '2.5s' }}></div>
            </div>

            {/* SOLD HEADER */}
            <div className="relative z-10">
              <span className="inline-block bg-emerald-500 text-ipl-dark font-black tracking-widest text-xs md:text-sm uppercase px-4 py-1 rounded-full shadow-lg mb-3">
                ★ AUCTION UPDATE ★
              </span>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 drop-shadow-[0_4px_25px_rgba(16,185,129,0.8)] leading-none mb-4">
                SOLD!
              </h1>
            </div>

            <div className="flex flex-col items-center gap-2 relative z-10">
              {/* Player Name */}
              <p className="text-white text-2xl md:text-4xl font-black uppercase tracking-wide drop-shadow-md">
                {soldAnimation.playerName}
              </p>
              
              <span className="text-ipl-goldLight text-xs md:text-sm font-bold uppercase tracking-[0.4em] my-1">
                PURCHASED BY
              </span>

              {/* TEAM LOGO HERO ANIMATION */}
              <div className="relative my-3 animate-bounce-slow">
                {/* Aura Glow */}
                <div className="absolute inset-0 bg-emerald-400/40 rounded-full blur-2xl scale-150 animate-pulse"></div>
                <img
                  src={getTeamLogo()}
                  alt={soldAnimation.teamName}
                  className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.7)] relative z-10 bg-ipl-dark object-contain p-3 ring-4 ring-ipl-gold/50"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(soldAnimation.teamName)}&backgroundColor=0b0f19&color=f5c453`;
                  }}
                />
              </div>

              {/* Team Name */}
              <h2 className="text-white text-2xl md:text-3xl font-black uppercase tracking-wider gold-text-gradient">
                {soldAnimation.teamName}
              </h2>

              {/* Price Banner */}
              <div className="mt-3 border-t border-emerald-500/30 pt-4 w-full max-w-xs">
                <span className="text-[10px] text-ipl-gray uppercase tracking-widest block mb-1">FINAL WINNING BID</span>
                <p className="text-emerald-400 text-4xl md:text-6xl font-black font-mono tracking-tight drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  {soldAnimation.price}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNSOLD OVERLAY */}
      {unsoldAnimation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
          <div className="text-center p-8 md:p-12 bg-gradient-to-b from-ipl-dark to-black border-4 border-red-500/80 rounded-3xl shadow-[0_0_120px_rgba(239,68,68,0.5)] animate-scale-in w-full max-w-md">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-red-500 drop-shadow-[0_4px_25px_rgba(239,68,68,0.8)] mb-3">
              UNSOLD
            </h1>
            {unsoldAnimation.playerName && (
              <p className="text-white/80 text-xl font-bold uppercase tracking-wide mt-2">
                {unsoldAnimation.playerName}
              </p>
            )}
            <p className="text-xs text-ipl-gray uppercase tracking-widest mt-4">No bids placed during countdown</p>
          </div>
        </div>
      )}
    </>
  );
}
