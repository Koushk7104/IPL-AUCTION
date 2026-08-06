import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { 
  Play, Pause, SkipForward, Check, XCircle, 
  Users, List, Shield, ChevronDown, ChevronUp, BarChart2,
  Gavel, Eye, Zap, AlertTriangle, Radio
} from 'lucide-react';
import SoldOverlay from './SoldOverlay';

export default function AdminDashboard({ setGlobalView }) {
  const { 
    auctionState, auctionStage, teams, logs, playersVersion, soldAnimation, unsoldAnimation,
    selectPlayer, startAuction, pauseAuction, 
    markSold, markUnsold, skipPlayer, endAuction, resetAuction
  } = useSocket();

  const [players, setPlayers] = useState([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('pending');
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Fetch all players to select from
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
  }, [auctionState.currentPlayer, playersVersion]);

  // Filter players list
  const filteredPlayers = players.filter((p) => {
    const matchesRole = selectedRoleFilter === 'All' || p.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'All' || p.status === selectedStatusFilter;
    return matchesRole && matchesStatus;
  });

  const formatPurse = (amount) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  const getTimerColor = (time) => {
    if (time > 15) return 'text-green-400 border-green-500/60';
    if (time > 5) return 'text-yellow-400 border-yellow-500/60';
    return 'text-red-500 border-red-500/60 timer-critical';
  };

  const getStageLabel = () => {
    switch (auctionStage) {
      case 'displaying': return { text: 'ON DISPLAY', color: 'text-ipl-blue', bg: 'bg-ipl-blue/10 border-ipl-blue/30' };
      case 'bidding': return { text: 'LIVE BIDDING', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' };
      case 'paused': return { text: 'PAUSED', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' };
      case 'ended': return { text: 'AUCTION ENDED', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
      default: return { text: 'SELECT A PLAYER', color: 'text-ipl-gray', bg: 'bg-white/5 border-white/10' };
    }
  };

  const stage = getStageLabel();

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-5">
      
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-center glassmorphism-gold rounded-2xl p-4 mb-5 animate-fade-in">
        <div className="flex items-center space-x-3 mb-3 md:mb-0">
          <div className="bg-ipl-gold/15 p-2.5 rounded-xl border border-ipl-gold/40">
            <Shield className="w-6 h-6 text-ipl-goldLight" />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase title-font text-white">Auctioneer Control</h1>
            <p className="text-[10px] text-ipl-gray tracking-wider">Manage live auction flow, select players, control bids</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Stage Indicator */}
          <div className={`px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-2 ${stage.bg} ${stage.color}`}>
            {auctionStage === 'bidding' && <Radio className="w-3.5 h-3.5 animate-live-dot" />}
            {stage.text}
          </div>

          <button 
            onClick={() => setGlobalView('display')}
            className="px-4 py-2 bg-ipl-dark/80 border border-ipl-gold/30 text-ipl-goldLight rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-ipl-gold hover:text-ipl-dark transition duration-300 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Projector
          </button>
          
          {auctionStage === 'ended' && (
            <button 
              onClick={() => setShowResetConfirmation(true)}
              className="px-4 py-2 bg-red-900/40 border border-red-500/50 text-red-300 hover:bg-red-600 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition duration-300 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Reset Entire Auction
            </button>
          )}

          {auctionStage !== 'ended' && (
            <button 
              onClick={() => setShowEndConfirmation(true)}
              className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition duration-300"
            >
              End Auction
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Live Auction Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Live Auction Board */}
          <div className="bg-ipl-card border border-white/5 rounded-2xl relative overflow-hidden">
            {/* Top accent bar */}
            {auctionStage === 'bidding' && <div className="gold-gradient-horizontal animate-shimmer h-[2px] w-full"></div>}
            {auctionStage !== 'bidding' && <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>}
            
            <div className="p-5">
              <h2 className="text-sm font-bold uppercase title-font text-ipl-goldLight mb-4 flex items-center gap-2">
                {auctionStage === 'bidding' && <span className="w-2 h-2 bg-red-500 rounded-full animate-live-dot"></span>}
                <Gavel className="w-4 h-4" />
                Live Auction Panel
              </h2>

              {auctionState.currentPlayer ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-in-up relative">
                  
                  {/* Sold/Unsold Overlay */}
                  <SoldOverlay soldAnimation={soldAnimation} unsoldAnimation={unsoldAnimation} teams={teams} />

                  {/* Active Player Card (2 cols) */}
                  <div className="md:col-span-2 bg-ipl-dark/50 border border-white/5 rounded-xl p-4 flex flex-col items-center text-center player-card-reveal">
                    <div className="relative mb-3">
                      <div className="absolute inset-0 bg-ipl-gold/10 rounded-full blur-xl animate-pulse-slow"></div>
                      <img 
                        src={auctionState.currentPlayer.image} 
                        alt={auctionState.currentPlayer.name} 
                        className="w-28 h-28 rounded-full border-[3px] border-ipl-gold/60 object-cover bg-ipl-dark relative z-10"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(auctionState.currentPlayer.name || 'player')}&backgroundColor=0b0f19&color=f5c453`;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-ipl-gold text-ipl-dark text-[10px] font-black px-2 py-0.5 rounded-full z-20 shadow-lg">
                        ⭐ {auctionState.currentPlayer.performanceRating}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white leading-tight">{auctionState.currentPlayer.name}</h3>
                    <p className="text-[10px] text-ipl-goldLight font-bold uppercase tracking-wider mt-0.5">
                      {auctionState.currentPlayer.role} • {auctionState.currentPlayer.country}
                    </p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-1.5 w-full mt-3 text-center">
                      <StatBox label="Matches" value={auctionState.currentPlayer.matches} />
                      {auctionState.currentPlayer.role === 'Bowler' ? (
                        <>
                          <StatBox label="Wickets" value={auctionState.currentPlayer.wickets} />
                          <StatBox label="Econ" value={auctionState.currentPlayer.economy} />
                        </>
                      ) : (
                        <>
                          <StatBox label="Runs" value={auctionState.currentPlayer.runs} />
                          <StatBox label="S/R" value={auctionState.currentPlayer.strikeRate} />
                        </>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 w-full flex justify-between text-xs">
                      <span className="text-ipl-gray">Base Price</span>
                      <span className="text-ipl-goldLight font-bold font-mono">{formatPurse(auctionState.currentPlayer.basePrice)}</span>
                    </div>
                  </div>

                  {/* Bidding & Timer Panel (3 cols) */}
                  <div className="md:col-span-3 flex flex-col space-y-4">
                    {/* Timer & Bid Display */}
                    <div className="bg-ipl-dark/50 border border-white/5 rounded-xl p-5 flex flex-col items-center text-center flex-1 justify-center">
                      <div className="text-[10px] text-ipl-gray uppercase tracking-[0.2em] mb-2">Timer</div>
                      <div className={`text-5xl font-extrabold w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4 font-mono ${getTimerColor(auctionState.timerRemaining)}`}>
                        {auctionState.timerRemaining}
                      </div>
                      
                      <div className="w-full border-t border-white/5 pt-4">
                        <div className="text-[10px] text-ipl-gray uppercase tracking-[0.2em] mb-1">Current Bid</div>
                        <div className="text-3xl font-black text-ipl-goldLight font-mono">
                          {auctionState.currentBid > 0 ? formatPurse(auctionState.currentBid) : 'No Bids'}
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          {auctionState.leadingTeam ? (
                            <span className="flex items-center justify-center gap-1.5">
                              {auctionState.leadingTeam.logo && <img src={auctionState.leadingTeam.logo} alt="" className="w-4 h-4 rounded-full"/>}
                              <span className="text-ipl-goldLight font-semibold">{auctionState.leadingTeam.teamName}</span>
                            </span>
                          ) : (
                            'Awaiting first bid'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Flow Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {auctionStage !== 'bidding' ? (
                        <button 
                          onClick={startAuction}
                          className="col-span-2 py-3 gold-gradient text-ipl-dark font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:shadow-gold-glow-large transition duration-300"
                        >
                          <Play className="w-4 h-4 fill-current" /> Start Bidding
                        </button>
                      ) : (
                        <button 
                          onClick={pauseAuction}
                          className="col-span-2 py-3 bg-yellow-600/90 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition duration-300"
                        >
                          <Pause className="w-4 h-4 fill-current" /> Pause
                        </button>
                      )}

                      <button 
                        onClick={markSold}
                        disabled={!auctionState.leadingTeam}
                        className="py-2.5 bg-emerald-600/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-500 disabled:opacity-25 transition duration-300"
                      >
                        <Check className="w-4 h-4" /> SOLD
                      </button>

                      <button 
                        onClick={markUnsold}
                        className="py-2.5 bg-red-600/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-red-500 transition duration-300"
                      >
                        <XCircle className="w-4 h-4" /> UNSOLD
                      </button>

                      <button 
                        onClick={skipPlayer}
                        className="col-span-2 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition duration-200"
                      >
                        <SkipForward className="w-3.5 h-3.5" /> Skip Player
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-white/5 rounded-xl">
                  <Gavel className="w-12 h-12 text-ipl-gold/20 mb-3 animate-float" />
                  <h3 className="text-base font-semibold text-white">No Player Selected</h3>
                  <p className="text-xs text-ipl-gray max-w-sm mt-1">
                    Select a player from the pool on the right to put them on display for all teams.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Teams Monitoring Dashboard */}
          <div className="bg-ipl-card border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-bold uppercase title-font text-ipl-goldLight mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Franchise Standings ({teams.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map((t) => {
                const isExpanded = expandedTeamId === t._id;
                return (
                  <div key={t._id} className="bg-ipl-dark/40 border border-white/5 rounded-xl p-3.5 transition-all duration-300 hover:border-ipl-gold/15">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2.5">
                        <img src={t.logo} alt={t.teamName} className="w-7 h-7 rounded-full bg-ipl-dark border border-white/10" />
                        <div>
                          <h3 className="text-xs font-bold text-white">{t.teamName}</h3>
                          <p className="text-[9px] text-ipl-goldLight font-medium uppercase tracking-wider">{t.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-ipl-gray uppercase">Purse</span>
                        <div className="text-[11px] font-bold text-ipl-goldLight font-mono">{formatPurse(t.remainingPurse)}</div>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2 text-center text-[10px]">
                      <div className="bg-white/5 py-1 px-2 rounded">
                        <span className="text-ipl-gray block text-[9px]">Bought</span>
                        <strong className="text-white">{t.squad?.length || 0}</strong>
                      </div>
                      <div className="bg-white/5 py-1 px-2 rounded">
                        <span className="text-ipl-gray block text-[9px]">Score</span>
                        <strong className="text-white">{t.squadStrength}</strong>
                      </div>
                      <div className="bg-white/5 py-1 px-2 rounded">
                        <span className="text-ipl-gray block text-[9px]">Avg</span>
                        <strong className="text-white">{t.avgRating}</strong>
                      </div>
                    </div>

                    {/* Role distribution */}
                    <div className="grid grid-cols-4 gap-1 mt-1.5 text-[8px] text-center text-white/60">
                      <div className="bg-ipl-gold/5 rounded py-0.5 border border-ipl-gold/10">BAT {t.roleCounts?.batters || 0}</div>
                      <div className="bg-ipl-gold/5 rounded py-0.5 border border-ipl-gold/10">BWL {t.roleCounts?.bowlers || 0}</div>
                      <div className="bg-ipl-gold/5 rounded py-0.5 border border-ipl-gold/10">AR {t.roleCounts?.allRounders || 0}</div>
                      <div className="bg-ipl-gold/5 rounded py-0.5 border border-ipl-gold/10">WK {t.roleCounts?.wicketKeepers || 0}</div>
                    </div>

                    {/* Squad toggle */}
                    <button 
                      onClick={() => setExpandedTeamId(isExpanded ? null : t._id)}
                      className="w-full flex items-center justify-center mt-2.5 text-[9px] text-ipl-gray hover:text-white transition duration-200"
                    >
                      {isExpanded ? (
                        <>Hide Squad <ChevronUp className="w-3 h-3 ml-1" /></>
                      ) : (
                        <>View Squad ({t.squad?.length || 0}) <ChevronDown className="w-3 h-3 ml-1" /></>
                      )}
                    </button>

                    {/* Squad details */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1 max-h-32 overflow-y-auto pr-1 animate-slide-down">
                        {t.squad && t.squad.length > 0 ? (
                          t.squad.map((player) => (
                            <div key={player._id} className="flex justify-between items-center text-[10px] bg-white/5 p-1.5 rounded">
                              <span className="font-medium text-white truncate max-w-[110px]">{player.name}</span>
                              <div className="flex space-x-2 text-[9px]">
                                <span className="text-ipl-goldLight">{player.performanceRating}</span>
                                <span className="text-ipl-gray font-mono">₹{(player.soldPrice / 10000000).toFixed(2)}Cr</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[9px] text-center text-ipl-gray py-2">Empty squad</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Player Pool & Logs (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Player Selection List */}
          <div className="bg-ipl-card border border-white/5 rounded-2xl p-4 flex flex-col h-[520px]">
            <h2 className="text-xs font-bold uppercase title-font text-ipl-goldLight mb-3 flex items-center gap-1.5">
              <List className="w-3.5 h-3.5" /> Player Pool
            </h2>

            {/* Filters */}
            <div className="space-y-1.5 mb-3 bg-ipl-dark/50 p-2.5 rounded-xl border border-white/5">
              <div className="flex gap-2">
                <select 
                  value={selectedRoleFilter} 
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-1/2 bg-ipl-dark border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:border-ipl-gold/50 transition"
                >
                  <option value="All">All Roles</option>
                  <option value="Batter">Batters</option>
                  <option value="Bowler">Bowlers</option>
                  <option value="All-Rounder">All-Rounders</option>
                  <option value="Wicket Keeper">Keepers</option>
                </select>

                <select 
                  value={selectedStatusFilter} 
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-1/2 bg-ipl-dark border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:border-ipl-gold/50 transition"
                >
                  <option value="pending">Unauctioned</option>
                  <option value="sold">Sold</option>
                  <option value="unsold">Unsold</option>
                  <option value="All">All</option>
                </select>
              </div>
            </div>

            {/* Scrollable players list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => {
                  const isCurrentActive = auctionState.currentPlayer?._id === player._id;
                  return (
                    <div 
                      key={player._id} 
                      className={`flex justify-between items-center bg-ipl-dark/40 border p-2 rounded-xl transition duration-200 ${
                        isCurrentActive 
                          ? 'border-ipl-gold/50 bg-ipl-gold/5 shadow-gold-glow' 
                          : player.status === 'sold'
                            ? 'border-emerald-500/20 opacity-50'
                            : player.status === 'unsold'
                              ? 'border-red-500/20 opacity-50'
                              : 'border-white/5 hover:border-ipl-gold/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <img 
                          src={player.image} 
                          alt={player.name} 
                          className="w-7 h-7 rounded-full border border-white/10 object-cover bg-ipl-dark flex-shrink-0"
                        />
                        <div className="truncate">
                          <h4 className="text-[11px] font-bold text-white truncate max-w-[100px]">{player.name}</h4>
                          <span className="text-[9px] text-ipl-gray uppercase">{player.role} • {player.performanceRating}★</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {player.status === 'pending' && (
                          <button 
                            onClick={() => selectPlayer(player._id)}
                            className="bg-ipl-gold hover:bg-ipl-goldLight text-ipl-dark text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition shadow-sm"
                          >
                            SELECT
                          </button>
                        )}
                        {player.status === 'sold' && (
                          <div className="text-right text-[9px]">
                            <span className="text-emerald-400 font-bold block">SOLD</span>
                            <span className="text-ipl-gray font-mono">₹{(player.soldPrice / 10000000).toFixed(1)}Cr</span>
                          </div>
                        )}
                        {player.status === 'unsold' && (
                          <div className="text-right text-[9px]">
                            <span className="text-red-400 font-bold block">UNSOLD</span>
                            <button 
                              onClick={() => selectPlayer(player._id)}
                              className="text-ipl-goldLight underline hover:text-white text-[8px] mt-0.5"
                            >
                              Re-List
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-[11px] text-ipl-gray py-12">No players match filters.</div>
              )}
            </div>
          </div>

          {/* Live Logs */}
          <div className="bg-ipl-card border border-white/5 rounded-2xl p-4 flex flex-col h-[260px]">
            <h2 className="text-xs font-bold uppercase title-font text-ipl-goldLight mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Auction Logs
            </h2>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg border leading-relaxed ${
                      log.type === 'bid' 
                        ? 'bg-ipl-gold/5 border-ipl-gold/10 text-ipl-goldLight' 
                        : log.type === 'success' 
                          ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                          : log.type === 'warning'
                            ? 'bg-yellow-600/5 border-yellow-600/10 text-yellow-400'
                            : 'bg-white/[0.02] border-white/5 text-white/70'
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              ) : (
                <div className="text-center text-ipl-gray py-8">Waiting for events...</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* END AUCTION CONFIRMATION MODAL */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-ipl-card border-2 border-red-500/30 rounded-2xl max-w-md w-full p-6 text-center shadow-red-glow animate-scale-in">
            <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold uppercase title-font text-white mb-2">End Auction?</h3>
            <p className="text-xs text-ipl-gray mb-6 leading-relaxed">
              This will conclude the SPEC IPL AUCTION 2026 permanently. Final standings will be calculated and the champion will be declared.
            </p>
            <div className="flex space-x-3 justify-center">
              <button 
                onClick={() => {
                  endAuction();
                  setShowEndConfirmation(false);
                  setGlobalView('leaderboard');
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition duration-200"
              >
                Yes, End Auction
              </button>
              <button 
                onClick={() => setShowEndConfirmation(false)}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-xl hover:bg-white/10 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET AUCTION CONFIRMATION MODAL */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-ipl-card border-2 border-red-500/50 rounded-2xl max-w-md w-full p-6 text-center shadow-red-glow animate-scale-in">
            <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold uppercase title-font text-white mb-2">Reset Entire Auction?</h3>
            <p className="text-xs text-red-300 mb-6 leading-relaxed bg-red-900/20 p-3 rounded-xl border border-red-900/50">
              WARNING: This will erase all team squads, reset all purses back to ₹210 Cr, and return all players to the unauctioned pool. This action cannot be undone!
            </p>
            <div className="flex space-x-3 justify-center">
              <button 
                onClick={() => {
                  resetAuction();
                  setShowResetConfirmation(false);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition duration-200"
              >
                Yes, Reset Everything
              </button>
              <button 
                onClick={() => setShowResetConfirmation(false)}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-xl hover:bg-white/10 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
      <div className="text-[8px] text-ipl-gray uppercase">{label}</div>
      <div className="text-xs font-bold text-white">{value}</div>
    </div>
  );
}
