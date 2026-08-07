import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Award, ChevronDown, ChevronUp, Star, Crown, Medal } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Leaderboard() {
  const [rankedTeams, setRankedTeams] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { teamsVersion, auctionStage } = useSocket();

  const fetchLeaderboard = async () => {
    try {
      const { data } = await axios.get('/api/teams/leaderboard');
      setRankedTeams(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [teamsVersion]);

  const formatPurse = (amount) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  const calculateRoleStrengths = (squad) => {
    let batting = 0, bowling = 0, allRounder = 0;
    squad.forEach((p) => {
      if (p.role === 'Batter' || p.role === 'Wicket Keeper') batting += p.performanceRating;
      else if (p.role === 'Bowler') bowling += p.performanceRating;
      else if (p.role === 'All-Rounder') allRounder += p.performanceRating;
    });
    return { batting, bowling, allRounder };
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-ipl-gold">
        <div className="w-10 h-10 border-4 border-t-transparent border-ipl-gold rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-ipl-gray">Computing Standings...</p>
      </div>
    );
  }

  const qualifiedTeams = rankedTeams.filter((t) => (t.squad?.length || 0) >= 15);
  const champion = qualifiedTeams.length > 0 ? qualifiedTeams[0] : null;
  const top3 = qualifiedTeams.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* CHAMPION HERO */}
      {champion && champion.squadStrength > 0 ? (
        <div className="glassmorphism-gold border-2 border-ipl-gold/30 rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-gold-glow-large animate-fade-in">
          {/* Glow effects */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-ipl-gold/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-ipl-gold/10 rounded-full blur-3xl animate-pulse-slow"></div>

          <Crown className="w-16 h-16 text-ipl-goldLight mx-auto mb-3 animate-bounce-slow" />
          <h1 className="text-3xl md:text-4xl font-black title-font uppercase tracking-wider text-white mb-1">
            AUCTION CHAMPION
          </h1>
          
          <div className="flex items-center justify-center gap-3 my-4">
            {champion.logo && <img src={champion.logo} alt="" className="w-12 h-12 rounded-full border-2 border-ipl-gold/50 shadow-gold-glow" />}
            <h2 className="text-2xl md:text-3xl font-black uppercase gold-text-gradient">
              {champion.teamName}
            </h2>
          </div>

          <div className="max-w-sm mx-auto grid grid-cols-3 gap-3 bg-ipl-dark/50 p-4 rounded-2xl border border-white/5 mt-4">
            <div className="text-center">
              <span className="text-[9px] text-ipl-gray uppercase tracking-widest block">Score</span>
              <strong className="text-xl font-black text-white font-mono">{champion.squadStrength}</strong>
            </div>
            <div className="text-center border-x border-white/10">
              <span className="text-[9px] text-ipl-gray uppercase tracking-widest block">Avg Rating</span>
              <strong className="text-xl font-black text-ipl-goldLight font-mono">{champion.avgRating}</strong>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-ipl-gray uppercase tracking-widest block">Squad</span>
              <strong className="text-xl font-black text-emerald-400 font-mono">{champion.squad?.length || 0}/15</strong>
            </div>
          </div>

          <p className="text-[10px] text-white/40 mt-5 italic">
            Qualified Champion (Minimum 15 Players Squad Rule Met)
          </p>
        </div>
      ) : (
        <div className="bg-ipl-card border border-white/5 rounded-3xl p-10 text-center mb-8 animate-fade-in">
          <Award className="w-14 h-14 text-ipl-gold/20 mx-auto mb-3" />
          <h2 className="text-xl font-bold uppercase title-font text-white">15 Players Required to Qualify</h2>
          <p className="text-xs text-ipl-gray mt-1 max-w-md mx-auto">
            Teams must complete a full 15-player roster to qualify for the championship. Teams with fewer than 15 players will be eliminated!
          </p>
        </div>
      )}

      {/* TOP 3 PODIUM */}
      {top3.length >= 3 && top3[0].squadStrength > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* 2nd Place */}
          <PodiumCard team={top3[1]} rank={2} formatPurse={formatPurse} />
          {/* 1st Place */}
          <PodiumCard team={top3[0]} rank={1} formatPurse={formatPurse} />
          {/* 3rd Place */}
          <PodiumCard team={top3[2]} rank={3} formatPurse={formatPurse} />
        </div>
      )}

      {/* FULL STANDINGS */}
      <div className="bg-ipl-card border border-white/5 rounded-2xl p-5">
        <h3 className="text-base font-black title-font uppercase text-ipl-goldLight mb-5 flex items-center justify-between border-b border-white/5 pb-3">
          <span className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Final Standings
          </span>
          <span className="text-[10px] text-ipl-gray font-normal normal-case">
            15 Players Required for Qualification
          </span>
        </h3>

        <div className="space-y-3">
          {rankedTeams.map((team, index) => {
            const isExpanded = expandedTeamId === team._id;
            const { batting, bowling, allRounder } = calculateRoleStrengths(team.squad || []);
            const squadCount = team.squad?.length || 0;
            const isDisqualified = auctionStage === 'ended' && squadCount < 15;
            const isWinner = index === 0 && !isDisqualified && team.squadStrength > 0;

            return (
              <div 
                key={team._id} 
                className={`border rounded-2xl p-4 transition-all duration-300 animate-fade-in ${
                  isWinner 
                    ? 'bg-ipl-gold/5 border-ipl-gold/30 shadow-gold-glow' 
                    : isDisqualified
                      ? 'bg-red-950/20 border-red-500/20 opacity-80'
                      : 'bg-ipl-dark/30 border-white/5 hover:border-ipl-gold/15'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Team Summary Row */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <span className={`text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border font-mono ${
                      isWinner 
                        ? 'bg-ipl-gold text-ipl-dark border-ipl-gold' 
                        : isDisqualified
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : index === 1 ? 'bg-gray-400/20 text-gray-300 border-gray-400/30'
                          : index === 2 ? 'bg-amber-700/20 text-amber-500 border-amber-600/30'
                          : 'bg-white/5 text-ipl-gray border-white/10'
                    }`}>
                      {index + 1}
                    </span>
                    <img src={team.logo} alt="" className="w-8 h-8 rounded-full bg-ipl-dark border border-white/10" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white uppercase">{team.teamName}</h4>
                        {isDisqualified && (
                          <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                            ELIMINATED
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${isDisqualified ? 'text-red-400' : 'text-ipl-goldLight'}`}>
                        {squadCount}/15 players {isDisqualified ? '(Incomplete)' : '✓ Qualified'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-ipl-gray uppercase block">Score</span>
                      <strong className={`text-lg font-black font-mono ${isDisqualified ? 'text-red-400/60 line-through' : 'text-white'}`}>
                        {team.squadStrength}
                      </strong>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-ipl-gray uppercase block">Purse Left</span>
                      <strong className="text-sm font-bold text-ipl-goldLight font-mono">{formatPurse(team.remainingPurse)}</strong>
                    </div>
                    <button 
                      onClick={() => setExpandedTeamId(isExpanded ? null : team._id)}
                      className="bg-white/5 border border-white/10 text-white hover:bg-white/10 p-2 rounded-lg transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-down">
                    {/* Strength Bars */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] uppercase font-black tracking-widest text-ipl-goldLight">Strength Analytics</h5>
                      <StrengthBar label="Batting" value={batting} max={400} color="bg-ipl-gold" />
                      <StrengthBar label="Bowling" value={bowling} max={400} color="bg-sky-400" />
                      <StrengthBar label="All-Round" value={allRounder} max={300} color="bg-emerald-400" />

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-[8px] text-ipl-gray uppercase block">Highest Buy</span>
                          <strong className="text-[11px] text-white font-mono">{team.highestPurchase > 0 ? formatPurse(team.highestPurchase) : '—'}</strong>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-[8px] text-ipl-gray uppercase block">Cheapest Buy</span>
                          <strong className="text-[11px] text-white font-mono">{team.cheapestPurchase > 0 ? formatPurse(team.cheapestPurchase) : '—'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Roster */}
                    <div>
                      <h5 className="text-[10px] uppercase font-black tracking-widest text-ipl-goldLight mb-2">Roster ({team.squad?.length || 0})</h5>
                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                        {team.squad && team.squad.length > 0 ? (
                          team.squad.map((player) => (
                            <div key={player._id} className="flex justify-between items-center text-[11px] bg-ipl-dark/50 border border-white/5 p-2 rounded-xl">
                              <div className="flex items-center space-x-2">
                                <img src={player.image} alt="" className="w-5 h-5 rounded-full object-cover bg-ipl-dark" />
                                <span className="font-bold text-white">{player.name}</span>
                              </div>
                              <div className="flex space-x-3 text-[10px]">
                                <span className="text-ipl-goldLight">{player.performanceRating}★</span>
                                <span className="text-ipl-gray font-mono">₹{(player.soldPrice / 10000000).toFixed(2)}Cr</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-center text-ipl-gray py-4">Empty roster</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ team, rank, formatPurse }) {
  const isFirst = rank === 1;
  return (
    <div className={`bg-ipl-card border rounded-2xl p-4 text-center transition-all duration-300 ${
      isFirst 
        ? 'border-ipl-gold/40 shadow-gold-glow -mt-2 pb-6' 
        : 'border-white/5 mt-4'
    } animate-fade-in-up`} style={{ animationDelay: `${rank * 0.15}s` }}>
      <div className={`mx-auto mb-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
        isFirst ? 'bg-ipl-gold text-ipl-dark' : rank === 2 ? 'bg-gray-400/30 text-gray-300' : 'bg-amber-700/30 text-amber-500'
      }`}>
        {rank}
      </div>
      {team.logo && <img src={team.logo} alt="" className="w-10 h-10 rounded-full mx-auto mb-2 border border-white/10" />}
      <h4 className="text-xs font-bold text-white uppercase truncate">{team.teamName}</h4>
      <div className={`text-lg font-black font-mono mt-1 ${isFirst ? 'text-ipl-goldLight' : 'text-white'}`}>
        {team.squadStrength}
      </div>
      <span className="text-[8px] text-ipl-gray uppercase">Score</span>
    </div>
  );
}

function StrengthBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-[9px] text-ipl-gray uppercase font-semibold mb-1">
        <span>{label}</span>
        <span className="text-white">{value} pts</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
