import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { DollarSign, Trophy, Sparkles, Award, User, Clock, Bell, Zap, Radio, Hand } from 'lucide-react';

export default function TeamDashboard() {
  const { 
    user, auctionState, auctionStage, teams, bidHistory, logs, notification, 
    soldAnimation, unsoldAnimation, clearNotification, placeBid 
  } = useSocket();

  const [bidCooldown, setBidCooldown] = useState(false);

  const formatPurse = (amount) => {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  };

  if (!user) return null;

  // Bidding validation
  const isFirstBid = auctionState.currentPlayer && !auctionState.leadingTeam;
  const currentBidAmount = auctionState.currentBid;
  const isBiddingActive = auctionStage === 'bidding'; // Only allow bids when actually bidding
  const isTeamLeading = auctionState.leadingTeam && auctionState.leadingTeam._id === user.id;

  // Can bid checks
  const canBidAmount = (increment) => {
    if (!isBiddingActive || bidCooldown) return false;
    if (isTeamLeading) return false;
    const nextBid = isFirstBid ? auctionState.currentPlayer.basePrice : (currentBidAmount + increment);
    return user.remainingPurse >= nextBid;
  };

  const handleBidClick = (increment) => {
    if (bidCooldown) return;
    setBidCooldown(true);
    placeBid(increment);
    setTimeout(() => {
      setBidCooldown(false);
    }, 2000);
  };

  const getTimerColor = (time) => {
    if (time > 15) return 'text-green-400 border-green-500/60';
    if (time > 5) return 'text-yellow-400 border-yellow-500/60';
    return 'text-red-500 border-red-500/60 timer-critical';
  };

  // Whether we should show the player card (anytime a player is selected, even in 'displaying' stage)
  const showPlayerCard = auctionState.currentPlayer && auctionStage !== 'idle' && auctionStage !== 'ended';

  // Stage-specific banner
  const getStageBanner = () => {
    if (!showPlayerCard) return null;

    if (auctionStage === 'displaying') {
      return (
        <div className="bg-ipl-blue/10 border border-ipl-blue/30 text-blue-400 text-xs font-bold rounded-xl py-3 px-4 text-center flex items-center justify-center gap-2 animate-fade-in">
          <Eye className="w-4 h-4" />
          PLAYER ON DISPLAY — Admin will start bidding shortly
        </div>
      );
    }

    if (isTeamLeading) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl py-3 px-4 text-center animate-pulse-slow shadow-green-glow">
          🏆 YOU ARE THE LEADING BIDDER!
        </div>
      );
    }

    if (auctionStage === 'bidding' && auctionState.leadingTeam) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl py-3 px-4 text-center animate-fade-in">
          ⚠️ OUTBID! Place a higher bid to stay in the race
        </div>
      );
    }

    if (auctionStage === 'bidding') {
      return (
        <div className="bg-ipl-gold/10 border border-ipl-gold/30 text-ipl-goldLight text-xs font-bold rounded-xl py-3 px-4 text-center flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          BIDDING OPEN — Base Price: {formatPurse(auctionState.currentPlayer?.basePrice)}
        </div>
      );
    }

    if (auctionStage === 'paused') {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded-xl py-3 px-4 text-center">
          ⏸️ AUCTION PAUSED — Awaiting administrator decision
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-5">
      
      {/* Pop-up Socket Notification */}
      {notification && (
        <div className={`fixed top-16 right-4 z-50 max-w-sm w-full p-4 rounded-xl shadow-card-elevated border flex justify-between items-start animate-slide-down ${
          notification.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300' 
            : notification.type === 'warning'
              ? 'bg-amber-950/95 border-amber-600/40 text-amber-300'
              : notification.type === 'error'
                ? 'bg-rose-950/95 border-rose-600/40 text-rose-300'
                : 'bg-ipl-card/95 border-ipl-gold/40 text-ipl-goldLight'
        }`}>
          <div className="flex space-x-2.5">
            <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[10px] uppercase font-black tracking-wider">Notification</h4>
              <p className="text-xs font-semibold mt-0.5 leading-snug">{notification.message}</p>
            </div>
          </div>
          <button onClick={clearNotification} className="text-xs opacity-60 hover:opacity-100 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Dashboard Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        
        {/* Team Profile */}
        <div className="bg-ipl-card border border-ipl-gold/20 rounded-2xl p-3.5 flex items-center space-x-3 shadow-gold-glow animate-fade-in col-span-2 md:col-span-1">
          <img src={user.logo} alt={user.teamName} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-ipl-dark border border-white/10 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-white leading-tight uppercase truncate">{user.teamName}</h1>
            <span className="text-[9px] text-ipl-goldLight font-bold uppercase tracking-widest">{user.username}</span>
          </div>
        </div>

        {/* Purse */}
        <div className="bg-ipl-card border border-white/5 rounded-2xl p-3.5 animate-fade-in col-span-2 md:col-span-1" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center text-[10px] text-ipl-gray">
            <span>PURSE LEFT</span>
            <DollarSign className="w-3.5 h-3.5 text-ipl-gold" />
          </div>
          <div className="text-xl md:text-2xl font-black text-ipl-goldLight font-mono mt-1">{formatPurse(user.remainingPurse)}</div>
          <div className="text-[8px] text-white/30 mt-0.5">of {formatPurse(user.initialPurse)}</div>
        </div>

        {/* Squad Count */}
        <div className="bg-ipl-card border border-white/5 rounded-2xl p-3.5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center text-[10px] text-ipl-gray">
            <span>SQUAD SIZE</span>
            <User className="w-3.5 h-3.5 text-ipl-gold" />
          </div>
          <div className="text-xl font-black font-mono mt-1 flex items-baseline gap-1">
            <span className={(user.squad?.length || 0) >= 15 ? 'text-emerald-400' : 'text-amber-400'}>
              {user.squad?.length || 0}
            </span>
            <span className="text-xs text-white/40 font-normal">/ 15 Req.</span>
          </div>
          <div className="text-[8px] text-white/30 mt-0.5">
            {(user.squad?.length || 0) >= 15 ? '✓ Qualified Squad' : `Need ${15 - (user.squad?.length || 0)} more to avoid elimination`}
          </div>
        </div>

        {/* Squad Strength */}
        <div className="bg-ipl-card border border-white/5 rounded-2xl p-3.5 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-ipl-gold/5 rounded-full blur-xl"></div>
          <div className="flex justify-between items-center text-[10px] text-ipl-gray">
            <span>STRENGTH</span>
            <Trophy className="w-3.5 h-3.5 text-ipl-goldLight" />
          </div>
          <div className="text-xl font-black text-white font-mono mt-1 flex items-center space-x-1">
            <span>{user.squadStrength || 0}</span>
            <Sparkles className="w-3.5 h-3.5 text-ipl-goldLight animate-pulse" />
          </div>
          <div className="text-[8px] text-white/30 mt-0.5">Avg: {user.avgRating || 0}</div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT/MID: Active Auction & Bidding (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Stage Banner */}
          {getStageBanner()}

          {/* Auction Card */}
          <div className="bg-ipl-card border border-white/5 rounded-2xl overflow-hidden">
            {isBiddingActive && <div className="gold-gradient-horizontal animate-shimmer h-[2px] w-full"></div>}
            
            <div className="p-5">
              {showPlayerCard ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5 relative">
                  
                  {/* Sold/Unsold Overlay */}
                  {soldAnimation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
                      <div className="text-center p-6 md:p-12 bg-gradient-to-b from-ipl-dark to-ipl-darker border-4 border-emerald-500 rounded-3xl shadow-[0_0_150px_rgba(16,185,129,0.4)] animate-scale-in w-full max-w-lg relative overflow-hidden">
                        <div className="sold-stamp text-5xl md:text-7xl mb-4 leading-none relative z-10">SOLD!</div>
                        <div className="flex flex-col items-center gap-3 relative z-10">
                          <p className="text-white text-xl md:text-3xl font-black animate-fade-in uppercase">{soldAnimation.playerName}</p>
                          <p className="text-ipl-gray text-xs uppercase tracking-[0.3em]">goes to</p>
                          {teams.find(t => t.teamName === soldAnimation.teamName) && (
                            <div className="relative my-3">
                              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-3xl scale-150 animate-pulse"></div>
                              <img 
                                src={teams.find(t => t.teamName === soldAnimation.teamName).logo} 
                                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-[5px] border-emerald-400/70 shadow-[0_0_50px_rgba(16,185,129,0.4)] relative z-10 bg-ipl-dark object-contain p-2" 
                                alt={soldAnimation.teamName} 
                              />
                            </div>
                          )}
                          <p className="text-white text-xl md:text-2xl font-black animate-fade-in uppercase">{soldAnimation.teamName}</p>
                          <div className="border-t-2 border-emerald-500/30 pt-3 mt-1 w-full max-w-xs">
                            <p className="text-emerald-400 text-3xl md:text-5xl font-black font-mono animate-fade-in">{soldAnimation.price}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {unsoldAnimation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
                      <div className="text-center p-6 md:p-12 bg-gradient-to-b from-ipl-dark to-ipl-darker border-4 border-red-500 rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.3)] animate-scale-in w-full max-w-md">
                        <div className="unsold-stamp text-4xl md:text-[6rem]">UNSOLD</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Player Details (2 cols) */}
                  <div className="md:col-span-2 bg-ipl-dark/40 border border-white/5 rounded-xl p-4 flex flex-col items-center text-center player-card-reveal">
                    <div className="relative mb-3">
                      <div className="absolute inset-0 bg-ipl-gold/10 rounded-full blur-xl animate-pulse-slow"></div>
                      <img 
                        src={auctionState.currentPlayer.image} 
                        alt={auctionState.currentPlayer.name} 
                        className="w-32 h-32 rounded-full border-[3px] border-ipl-gold/50 object-cover bg-ipl-dark relative z-10"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-ipl-gold text-ipl-dark text-[10px] font-black px-2 py-0.5 rounded-full z-20 shadow-lg">
                        ⭐ {auctionState.currentPlayer.performanceRating}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white leading-tight">{auctionState.currentPlayer.name}</h3>
                    <p className="text-[10px] text-ipl-goldLight font-bold uppercase tracking-wider mt-0.5 mb-3">
                      {auctionState.currentPlayer.role} • {auctionState.currentPlayer.country}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 w-full text-center mb-3">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-[8px] text-ipl-gray uppercase block">Matches</span>
                        <strong className="text-sm font-extrabold text-white">{auctionState.currentPlayer.matches}</strong>
                      </div>
                      {auctionState.currentPlayer.role === 'Bowler' ? (
                        <>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[8px] text-ipl-gray uppercase block">Wickets</span>
                            <strong className="text-sm font-extrabold text-white">{auctionState.currentPlayer.wickets}</strong>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[8px] text-ipl-gray uppercase block">Econ</span>
                            <strong className="text-sm font-extrabold text-white">{auctionState.currentPlayer.economy}</strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[8px] text-ipl-gray uppercase block">Runs</span>
                            <strong className="text-sm font-extrabold text-white">{auctionState.currentPlayer.runs}</strong>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-[8px] text-ipl-gray uppercase block">S/R</span>
                            <strong className="text-sm font-extrabold text-white">{auctionState.currentPlayer.strikeRate}</strong>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Style info */}
                    <div className="w-full space-y-1 text-[10px]">
                      <div className="flex justify-between bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-ipl-gray">Batting</span>
                        <span className="text-white/80">{auctionState.currentPlayer.battingStyle}</span>
                      </div>
                      <div className="flex justify-between bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-ipl-gray">Bowling</span>
                        <span className="text-white/80">{auctionState.currentPlayer.bowlingStyle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bidding Panel (3 cols) */}
                  <div className="md:col-span-3 flex flex-col space-y-4">
                    {/* Timer & Bid */}
                    <div className="bg-ipl-dark/50 border border-white/5 rounded-xl p-5 flex flex-col items-center text-center flex-1 justify-center">
                      <div className="flex items-center gap-1.5 text-[10px] text-ipl-gray uppercase tracking-[0.2em] mb-2">
                        <Clock className="w-3 h-3" /> Timer
                      </div>
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

                    {/* Bid Buttons */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-ipl-gray uppercase font-bold tracking-wider">
                        <Hand className="w-3 h-3" />
                        {isBiddingActive ? 'Raise Your Paddle' : auctionStage === 'displaying' ? 'Bidding Not Started Yet' : 'Bidding Paused'}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <BidButton 
                          label="+20 L" 
                          disabled={!canBidAmount(2000000)} 
                          onClick={() => handleBidClick(2000000)}
                          variant="secondary"
                        />
                        <BidButton 
                          label="+50 L" 
                          disabled={!canBidAmount(5000000)} 
                          onClick={() => handleBidClick(5000000)}
                          variant="secondary"
                        />
                        <BidButton 
                          label="+1 Cr" 
                          disabled={!canBidAmount(10000000)} 
                          onClick={() => handleBidClick(10000000)}
                          variant="primary"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Custom Amount (in Cr)"
                          className="w-full sm:flex-1 bg-ipl-dark/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold placeholder-white/30 focus:outline-none focus:border-ipl-gold/50"
                          id="customBidInput"
                        />
                        <button
                          onClick={() => {
                            if (bidCooldown) return;
                            const val = parseFloat(document.getElementById('customBidInput').value);
                            if (val > 0) {
                              setBidCooldown(true);
                              placeBid(null, val * 10000000);
                              document.getElementById('customBidInput').value = '';
                              setTimeout(() => setBidCooldown(false), 2000);
                            }
                          }}
                          disabled={!isBiddingActive || isTeamLeading || bidCooldown}
                          className="w-full sm:w-auto bg-ipl-gold/10 border border-ipl-gold/30 text-ipl-goldLight hover:bg-ipl-gold hover:text-ipl-dark px-4 py-2 rounded-xl text-xs font-black disabled:opacity-20 transition-all duration-200"
                        >
                          Bid Custom
                        </button>
                      </div>

                      {isTeamLeading && isBiddingActive && (
                        <div className="text-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-2">
                          ✓ You're in the lead — no need to bid again
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-xl">
                  <Clock className="w-12 h-12 text-ipl-gold/20 mb-3 animate-float" />
                  <h3 className="text-base font-semibold text-white">Awaiting Next Player</h3>
                  <p className="text-xs text-ipl-gray max-w-xs mt-1">
                    The auctioneer is preparing the next player. You'll see the card as soon as it's on display.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Squad Roster */}
          <div className="bg-ipl-card border border-white/5 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-sm font-bold uppercase title-font text-ipl-goldLight flex items-center gap-2">
                <Award className="w-4 h-4" />
                Your Squad ({user.squad?.length || 0})
              </h2>

              {/* Role counters */}
              <div className="flex space-x-1 text-[8px] font-black text-white/70">
                <span className="bg-white/5 px-2 py-1 rounded border border-white/5">BAT {user.roleCounts?.batters || 0}</span>
                <span className="bg-white/5 px-2 py-1 rounded border border-white/5">BWL {user.roleCounts?.bowlers || 0}</span>
                <span className="bg-white/5 px-2 py-1 rounded border border-white/5">AR {user.roleCounts?.allRounders || 0}</span>
                <span className="bg-white/5 px-2 py-1 rounded border border-white/5">WK {user.roleCounts?.wicketKeepers || 0}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {user.squad && user.squad.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-ipl-gray font-bold text-[9px] uppercase">
                      <th className="py-2.5">Player</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5 text-center">Rating</th>
                      <th className="py-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {user.squad.map((player) => (
                      <tr key={player._id} className="hover:bg-white/[0.02] transition duration-150">
                        <td className="py-2.5 flex items-center space-x-2.5">
                          <img src={player.image} alt={player.name} className="w-6 h-6 rounded-full border border-white/10 object-cover bg-ipl-dark" />
                          <span className="font-bold text-white">{player.name}</span>
                        </td>
                        <td className="py-2.5 text-ipl-gray">{player.role}</td>
                        <td className="py-2.5 text-center">
                          <span className="bg-ipl-gold/10 text-ipl-goldLight font-bold px-2 py-0.5 rounded text-[10px] border border-ipl-gold/20">
                            {player.performanceRating}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">
                          ₹{(player.soldPrice / 10000000).toFixed(2)} Cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center text-xs text-ipl-gray py-8">Your squad is empty. Start bidding to purchase players!</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Log (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-ipl-card border border-white/5 rounded-2xl p-4 flex flex-col h-[400px]">
            <h2 className="text-xs font-bold uppercase title-font text-ipl-goldLight mb-3 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Live Feed
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
                <div className="text-center text-ipl-gray py-12">Waiting for live events...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BidButton({ label, disabled, onClick, variant }) {
  const base = variant === 'primary'
    ? 'gold-gradient text-ipl-dark hover:shadow-gold-glow-large'
    : 'bg-ipl-card border border-ipl-gold/30 text-ipl-goldLight hover:bg-ipl-gold hover:text-ipl-dark';
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`py-3 text-xs font-black rounded-xl disabled:opacity-20 disabled:hover:shadow-none transition-all duration-200 ${base}`}
    >
      {label}
    </button>
  );
}

// Eye icon for displaying stage
function Eye(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
