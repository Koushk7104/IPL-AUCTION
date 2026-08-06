import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { Clock, Users, Sparkles, Radio, Trophy } from 'lucide-react';
import SoldOverlay from './SoldOverlay';

export default function PublicDisplay() {
  const { auctionState, auctionStage, teams, playersVersion, soldAnimation, unsoldAnimation } = useSocket();
  const [players, setPlayers] = useState([]);

  const fetchPlayers = async () => {
    try {
      const { data } = await axios.get('/api/players');
      setPlayers(data);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [auctionState.currentPlayer, auctionState.status, playersVersion]);

  const formatPurse = (amount) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  // Highlights
  const soldPlayers = players.filter((p) => p.status === 'sold');
  const mostExpensive = soldPlayers.length > 0 
    ? [...soldPlayers].sort((a, b) => b.soldPrice - a.soldPrice)[0] 
    : null;
  const recentlySold = soldPlayers.length > 0 
    ? [...soldPlayers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] 
    : null;

  const getTimerColor = (time) => {
    if (time > 15) return 'border-green-500/60 text-green-400';
    if (time > 5) return 'border-yellow-500/60 text-yellow-400';
    return 'border-red-500/60 text-red-500 timer-critical';
  };

  const showPlayer = auctionState.currentPlayer && auctionStage !== 'idle' && auctionStage !== 'ended';

  return (
    <div className="min-h-screen bg-ipl-darker flex flex-col justify-between p-5 stadium-glow">
      
      {/* Header Banner */}
      <div className="flex justify-between items-center glassmorphism-gold rounded-2xl px-6 py-3.5 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="bg-ipl-gold/10 p-2 rounded-xl border border-ipl-gold/30">
            <Sparkles className="w-6 h-6 text-ipl-goldLight animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black title-font uppercase tracking-wider gold-text-gradient">SPEC IPL AUCTION 2026</h1>
            <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">Live Arena Display • 2026</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-right flex items-center gap-3">
          {(auctionStage === 'bidding' || auctionStage === 'displaying') && (
            <span className="live-indicator live-indicator-active">
              <span className="live-indicator-dot"></span>
              LIVE
            </span>
          )}
          <div>
            <div className="text-[9px] text-ipl-gray uppercase font-bold tracking-widest">Status</div>
            <div className="text-sm font-bold uppercase tracking-wider text-white">
              {auctionStage === 'bidding' ? 'LIVE BIDDING' 
                : auctionStage === 'displaying' ? 'ON DISPLAY'
                : auctionStage === 'paused' ? 'PAUSED' 
                : auctionStage === 'ended' ? 'CONCLUDED'
                : 'STANDBY'}
            </div>
          </div>
        </div>
      </div>

      {/* Live shimmer bar */}
      {auctionStage === 'bidding' && <div className="gold-gradient-horizontal animate-shimmer h-[2px] w-full rounded-full mt-1"></div>}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-5 flex-1 items-stretch">
        
        {/* LEFT: Team Standings (3 cols) */}
        <div className="lg:col-span-3 bg-ipl-card/80 border border-white/5 rounded-2xl p-4 flex flex-col">
          <h2 className="text-xs font-black title-font uppercase text-ipl-goldLight mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
            <Trophy className="w-3.5 h-3.5" /> Team Standings
          </h2>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {[...teams].map(t => {
              const count = Array.isArray(t.squad) ? t.squad.length : 0;
              return { ...t, squadCount: count, isQualified: count >= 15 };
            }).sort((a, b) => {
              if (a.isQualified !== b.isQualified) return a.isQualified ? -1 : 1;
              return b.squadStrength - a.squadStrength;
            }).map((team, idx) => (
              <div key={team._id} className={`flex justify-between items-center p-2 rounded-xl text-xs transition border ${
                team.isQualified 
                  ? 'bg-ipl-dark/50 border-white/5 hover:border-ipl-gold/15' 
                  : 'bg-red-950/20 border-red-500/20 opacity-80'
              }`}>
                <div className="flex items-center space-x-2 truncate">
                  <span className={`w-5 h-5 text-[10px] font-black flex items-center justify-center rounded-full ${
                    team.isQualified && idx === 0 ? 'bg-ipl-gold text-ipl-dark' : 'bg-white/5 text-ipl-gray'
                  }`}>{idx + 1}</span>
                  <img src={team.logo} alt={team.teamName} className="w-5 h-5 rounded-full bg-ipl-dark object-contain" />
                  <div>
                    <span className="font-bold text-white truncate max-w-[80px] text-[11px] block">{team.teamName}</span>
                    <span className={`text-[8px] block font-semibold ${team.isQualified ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {team.squadCount}/15 Players
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold font-mono block ${team.isQualified ? 'text-ipl-goldLight' : 'text-red-400/70 line-through'}`}>
                    {team.squadStrength} pts
                  </span>
                  <span className="text-[8px] text-ipl-gray block">₹{(team.remainingPurse / 10000000).toFixed(0)}Cr</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: Player Card (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          {showPlayer ? (
            <div className="bg-ipl-card/90 border border-ipl-gold/20 rounded-3xl flex-1 flex flex-col justify-center text-center relative overflow-hidden animate-gold-pulse shadow-gold-glow-large p-6 md:p-8">
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] gold-gradient"></div>
              
              {/* Sold/Unsold Overlay */}
              <SoldOverlay soldAnimation={soldAnimation} unsoldAnimation={unsoldAnimation} teams={teams} />

              {/* Player Image */}
              <div className="flex justify-center mb-4">
                <div className="relative player-card-reveal">
                  <div className="absolute inset-0 bg-ipl-gold/15 rounded-full blur-2xl scale-125 animate-pulse-slow"></div>
                  <img 
                    src={auctionState.currentPlayer.image} 
                    alt={auctionState.currentPlayer.name} 
                    className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-ipl-gold/60 object-cover bg-ipl-dark relative z-10 shadow-2xl"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(auctionState.currentPlayer.name || 'player')}&backgroundColor=0b0f19&color=f5c453`;
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-ipl-gold text-ipl-dark text-sm md:text-base font-black w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 border-ipl-dark z-20 shadow-lg">
                    {auctionState.currentPlayer.performanceRating}
                  </div>
                </div>
              </div>

              {/* Player Details */}
              <div className="space-y-1 animate-fade-in-up">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-none uppercase">{auctionState.currentPlayer.name}</h2>
                <p className="text-sm font-bold text-ipl-goldLight tracking-widest uppercase mt-2">
                  {auctionState.currentPlayer.role} • {auctionState.currentPlayer.country}
                </p>
                {auctionState.currentPlayer.bowlingStyle !== 'N/A' && (
                  <p className="text-[10px] text-ipl-gray mt-1">
                    {auctionState.currentPlayer.battingStyle} • {auctionState.currentPlayer.bowlingStyle}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto w-full my-5 text-center">
                <StatBlock label="Matches" value={auctionState.currentPlayer.matches} />
                <StatBlock label="Rating" value={auctionState.currentPlayer.performanceRating} highlight />
                {auctionState.currentPlayer.role === 'Bowler' ? (
                  <>
                    <StatBlock label="Wickets" value={auctionState.currentPlayer.wickets} />
                    <StatBlock label="Economy" value={auctionState.currentPlayer.economy} />
                  </>
                ) : (
                  <>
                    <StatBlock label="Runs" value={auctionState.currentPlayer.runs} />
                    <StatBlock label="S/R" value={auctionState.currentPlayer.strikeRate} />
                  </>
                )}
              </div>

              {/* Current Bid Dashboard */}
              <div className="bg-ipl-dark/60 border border-white/5 rounded-2xl p-4 max-w-lg mx-auto w-full">
                <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
                  <div className="text-center">
                    <span className="text-[9px] text-ipl-gray uppercase tracking-wider block mb-1">CURRENT BID</span>
                    <strong className="text-2xl md:text-3xl font-black text-ipl-goldLight font-mono">
                      {auctionState.currentBid > 0 ? formatPurse(auctionState.currentBid) : formatPurse(auctionState.currentPlayer.basePrice)}
                    </strong>
                    <span className="text-[8px] text-white/30 block mt-0.5">
                      {auctionState.currentBid > 0 ? 'Active Bids' : 'Base Price'}
                    </span>
                  </div>
                  <div className="text-center flex flex-col justify-center items-center pl-4">
                    <span className="text-[9px] text-ipl-gray uppercase tracking-wider block mb-1">LEADING</span>
                    {auctionState.leadingTeam ? (
                      <div className="flex items-center space-x-2">
                        <img src={auctionState.leadingTeam.logo} alt="" className="w-6 h-6 rounded-full" />
                        <strong className="text-base md:text-lg font-black text-white uppercase">{auctionState.leadingTeam.teamName}</strong>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-white/40 uppercase italic">No Bids</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-ipl-card border border-white/5 rounded-3xl flex-1 flex flex-col items-center justify-center text-center p-12 shadow-inner-gold">
              <Clock className="w-16 h-16 text-ipl-gold/15 mb-4 animate-float" />
              <h2 className="text-2xl md:text-3xl font-black title-font text-white uppercase tracking-wider">Awaiting Next Player</h2>
              <p className="text-sm text-ipl-gray max-w-sm mt-2">
                The auctioneer is preparing the next card. Stay tuned!
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Timer & Highlights (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-5">
          
          {/* Timer */}
          <div className="bg-ipl-card/80 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center py-8">
            <span className="text-[10px] text-ipl-gray uppercase tracking-[0.2em] font-black mb-4">COUNTDOWN</span>
            <div className={`text-6xl font-extrabold w-32 h-32 rounded-full border-[6px] flex items-center justify-center font-mono shadow-2xl ${getTimerColor(auctionState.timerRemaining)}`}>
              {auctionState.timerRemaining}
            </div>
            <span className="text-[9px] text-white/30 uppercase tracking-widest mt-4">Seconds</span>
          </div>

          {/* Activity Highlights */}
          <div className="bg-ipl-card/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-center space-y-4 flex-1">
            <h3 className="text-[10px] font-black title-font uppercase text-ipl-goldLight border-b border-white/5 pb-2">
              Highlights
            </h3>

            {/* Recently Sold */}
            <div>
              <span className="text-[8px] text-ipl-gray uppercase font-bold block mb-1">Recently Sold</span>
              {recentlySold ? (
                <div className="bg-ipl-dark/50 border border-white/5 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img src={recentlySold.image} alt="" className="w-6 h-6 rounded-full bg-ipl-dark object-cover" />
                    <div>
                      <h4 className="text-[11px] font-bold text-white leading-tight">{recentlySold.name}</h4>
                      <span className="text-[8px] text-ipl-gray uppercase">{recentlySold.role}</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="text-emerald-400 font-bold block">SOLD</span>
                    <strong className="text-white font-mono">₹{(recentlySold.soldPrice / 10000000).toFixed(2)}Cr</strong>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-white/30 italic">No sales yet</span>
              )}
            </div>

            {/* Most Expensive */}
            <div>
              <span className="text-[8px] text-ipl-gray uppercase font-bold block mb-1">Highest Bid</span>
              {mostExpensive ? (
                <div className="bg-ipl-dark/50 border border-ipl-gold/10 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img src={mostExpensive.image} alt="" className="w-6 h-6 rounded-full bg-ipl-dark object-cover" />
                    <div>
                      <h4 className="text-[11px] font-bold text-white leading-tight">{mostExpensive.name}</h4>
                      <span className="text-[8px] text-ipl-goldLight uppercase font-black">RECORD</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <span className="text-ipl-goldLight font-bold block">₹{(mostExpensive.soldPrice / 10000000).toFixed(2)}Cr</span>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-white/30 italic">No records yet</span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <span className="text-[8px] text-ipl-gray uppercase block">Total Sold</span>
                <strong className="text-sm text-white font-mono">{soldPlayers.length}</strong>
              </div>
              <div className="bg-white/5 p-2 rounded-lg text-center">
                <span className="text-[8px] text-ipl-gray uppercase block">Pending</span>
                <strong className="text-sm text-white font-mono">{players.filter(p => p.status === 'pending').length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-ipl-gray/50 flex justify-between items-center border-t border-white/5 pt-3">
        <span>© 2026 SPEC IPL AUCTION</span>
        <span>Live Arena Display</span>
      </div>
    </div>
  );
}

function StatBlock({ label, value, highlight }) {
  return (
    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
      <div className="text-[8px] text-ipl-gray uppercase">{label}</div>
      <div className={`text-base font-extrabold ${highlight ? 'text-ipl-goldLight' : 'text-white'}`}>{value}</div>
    </div>
  );
}
