const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// MongoDB models (only used in non-demo mode)
let Player, Team, AuctionState, BidHistory;

// Demo data (only used in demo mode)
let demoData;

let timerInterval = null;
let isDemoMode = false;

const broadcastPlayerRefresh = (io) => {
  io.to('general').emit('players:update');
};

// =============================================
// DATA LAYER: Abstracts demo vs MongoDB access
// =============================================

const dataLayer = {
  async getAuctionState() {
    if (isDemoMode) {
      return { ...demoData.demoAuctionState };
    }
    return await AuctionState.findOne();
  },

  async getFullAuctionState() {
    if (isDemoMode) {
      const state = { ...demoData.demoAuctionState };
      if (state.currentPlayer) {
        const player = demoData.demoPlayers.find(p => p._id === state.currentPlayer);
        if (player) {
          const leadingTeam = state.leadingTeam 
            ? demoData.demoTeams.find(t => t._id === state.leadingTeam) 
            : null;
          state.currentPlayer = {
            ...player,
            leadingTeam: leadingTeam ? { _id: leadingTeam._id, teamName: leadingTeam.teamName, logo: leadingTeam.logo } : null
          };
        } else {
          state.currentPlayer = null;
        }
      }
      if (state.leadingTeam && typeof state.leadingTeam === 'string') {
        const lt = demoData.demoTeams.find(t => t._id === state.leadingTeam);
        state.leadingTeam = lt ? { _id: lt._id, teamName: lt.teamName, logo: lt.logo } : null;
      }
      return state;
    }
    return await AuctionState.findOne().populate({
      path: 'currentPlayer',
      populate: { path: 'leadingTeam', select: 'teamName logo' }
    }).populate('leadingTeam', 'teamName logo');
  },

  async saveAuctionState(state) {
    if (isDemoMode) {
      Object.assign(demoData.demoAuctionState, state);
      return;
    }
    await state.save();
  },

  async findPlayerById(id) {
    if (isDemoMode) {
      return demoData.demoPlayers.find(p => p._id === id) || null;
    }
    return await Player.findById(id);
  },

  async savePlayer(player) {
    if (isDemoMode) {
      // Player is already mutated in-place for demo
      player.updatedAt = new Date().toISOString();
      return;
    }
    await player.save();
  },

  async findTeamById(id) {
    if (isDemoMode) {
      return demoData.demoTeams.find(t => t._id === id) || null;
    }
    return await Team.findById(id);
  },

  async saveTeam(team) {
    if (isDemoMode) {
      team.updatedAt = new Date().toISOString();
      return;
    }
    await team.save();
  },

  async getAllTeamsPopulated() {
    if (isDemoMode) {
      const { getDemoTeams } = demoData;
      // Inline populate squad
      return demoData.demoTeams.map(t => ({
        ...t,
        squad: (t.squad || []).map(pid => {
          if (typeof pid === 'object') return pid;
          return demoData.demoPlayers.find(p => p._id === pid) || null;
        }).filter(Boolean)
      }));
    }
    return await Team.find().populate('squad').select('-password');
  },

  async deleteBidHistory(playerId) {
    if (isDemoMode) {
      // No-op in demo, we just clear the array
      return;
    }
    await BidHistory.deleteMany({ player: playerId });
  },

  async createBidHistory(entry) {
    if (isDemoMode) {
      return { ...entry, createdAt: new Date().toISOString() };
    }
    const bidLog = new BidHistory(entry);
    await bidLog.save();
    return bidLog;
  },

  async getBidHistory(playerId) {
    if (isDemoMode) {
      return [];
    }
    return await BidHistory.find({ player: playerId })
      .populate('team', 'teamName logo')
      .sort({ createdAt: -1 })
      .limit(20);
  },

  async getPopulatedSquad(squadIds) {
    if (isDemoMode) {
      return squadIds.map(id => {
        if (typeof id === 'object') return id;
        return demoData.demoPlayers.find(p => p._id === id) || null;
      }).filter(Boolean);
    }
    return await Player.find({ _id: { $in: squadIds } });
  }
};

// =============================================
// SOCKET INITIALIZATION
// =============================================

const initSocket = (server, demoMode = false) => {
  isDemoMode = demoMode;

  if (!demoMode) {
    Player = require('../models/Player');
    Team = require('../models/Team');
    AuctionState = require('../models/AuctionState');
    BidHistory = require('../models/BidHistory');
  } else {
    demoData = require('../lib/demoData');
  }

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication Middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'ipl_mega_auction_secret_2026_key_9876';
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      const decoded = jwt.verify(cleanToken, jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Socket Authentication Error:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // In-memory bid history for demo mode
  let demoBidHistory = [];

  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.username}, Role: ${socket.user.role})`);

    // Join room based on user role
    if (socket.user.role === 'admin') {
      socket.join('admin');
    } else if (socket.user.role === 'team') {
      socket.join('teams');
      socket.join(`team:${socket.user.id}`);
    }
    socket.join('general');

    // Send initial state to the newly connected client
    try {
      const state = await dataLayer.getFullAuctionState();
      socket.emit('auction:state', state);

      const teams = await dataLayer.getAllTeamsPopulated();
      socket.emit('teams:update', teams);

      if (state.currentPlayer) {
        const bids = isDemoMode ? demoBidHistory : await dataLayer.getBidHistory(state.currentPlayer._id);
        socket.emit('auction:bid-history', bids);
      }
    } catch (err) {
      console.error('Error sending initial state:', err.message);
    }

    // --- ADMIN EVENTS ---

    // 1. Select Player for Auction
    socket.on('admin:select-player', async ({ playerId }) => {
      if (socket.user.role !== 'admin') return;

      try {
        stopTimer();

        const player = await dataLayer.findPlayerById(playerId);
        if (!player) {
          return socket.emit('error', 'Player not found');
        }

        if (player.status !== 'pending' && player.status !== 'unsold') {
          return socket.emit('error', 'Player is already sold or active');
        }

        // Set player to active
        player.status = 'active';
        player.currentBid = 0;
        player.leadingTeam = null;
        await dataLayer.savePlayer(player);

        // Update global auction state
        const state = await dataLayer.getAuctionState();
        state.currentPlayer = isDemoMode ? player._id : player._id;
        state.status = 'idle';
        state.currentBid = 0;
        state.leadingTeam = null;
        state.timerRemaining = state.timerDuration || 120;
        await dataLayer.saveAuctionState(state);

        // Delete any old bid history
        await dataLayer.deleteBidHistory(player._id);
        demoBidHistory = [];

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        io.to('general').emit('auction:bid-history', []);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:log', {
          type: 'info',
          message: `Player ${player.name} (${player.role}) is selected. Base Price: ₹${(player.basePrice / 10000000).toFixed(2)} Cr.`
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to select player');
      }
    });

    // 2. Start/Resume Auction Timer
    socket.on('admin:start-auction', async () => {
      if (socket.user.role !== 'admin') return;

      try {
        const state = await dataLayer.getAuctionState();
        if (!state.currentPlayer) {
          return socket.emit('error', 'No player selected');
        }

        state.status = 'active';
        await dataLayer.saveAuctionState(state);

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:log', {
          type: 'success',
          message: 'Auction bidding has started/resumed!'
        });

        startTimer(io);
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to start auction');
      }
    });

    // 3. Pause Auction
    socket.on('admin:pause-auction', async () => {
      if (socket.user.role !== 'admin') return;

      try {
        stopTimer();

        const state = await dataLayer.getAuctionState();
        state.status = 'paused';
        await dataLayer.saveAuctionState(state);

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:log', {
          type: 'warning',
          message: 'Auction has been paused by the administrator.'
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to pause auction');
      }
    });

    // 4. Mark Player Sold
    socket.on('admin:mark-sold', async () => {
      if (socket.user.role !== 'admin') return;

      try {
        stopTimer();

        const state = await dataLayer.getAuctionState();
        if (!state.currentPlayer) {
          return socket.emit('error', 'No player currently up for auction');
        }

        if (!state.leadingTeam) {
          return socket.emit('error', 'Cannot sell a player with no bids. Mark as unsold instead.');
        }

        const currentPlayerId = isDemoMode ? state.currentPlayer : state.currentPlayer;
        const leadingTeamId = isDemoMode ? state.leadingTeam : state.leadingTeam;

        const player = await dataLayer.findPlayerById(currentPlayerId);
        const team = await dataLayer.findTeamById(leadingTeamId);

        if (!player || !team) {
          return socket.emit('error', 'Player or Team data not found');
        }

        const finalPrice = state.currentBid;

        if (team.remainingPurse < finalPrice) {
          return socket.emit('error', `Team ${team.teamName} has insufficient budget!`);
        }

        // Update player
        player.status = 'sold';
        player.soldPrice = finalPrice;
        player.buyerTeam = team._id;
        await dataLayer.savePlayer(player);

        // Update team
        if (!team.squad) team.squad = [];
        team.squad.push(player._id);
        team.remainingPurse -= finalPrice;

        // Recalculate analytics
        const populatedSquad = await dataLayer.getPopulatedSquad(team.squad);
        let squadStrength = 0, totalRating = 0;
        let batters = 0, bowlers = 0, allRounders = 0, wicketKeepers = 0;
        populatedSquad.forEach((p) => {
          squadStrength += p.performanceRating;
          totalRating += p.performanceRating;
          if (p.role === 'Batter') batters++;
          else if (p.role === 'Bowler') bowlers++;
          else if (p.role === 'All-Rounder') allRounders++;
          else if (p.role === 'Wicket Keeper') wicketKeepers++;
        });

        team.squadStrength = squadStrength;
        team.avgRating = populatedSquad.length > 0 ? Number((totalRating / populatedSquad.length).toFixed(1)) : 0;
        team.roleCounts = { batters, bowlers, allRounders, wicketKeepers };
        team.highestPurchase = Math.max(team.highestPurchase || 0, finalPrice);
        team.cheapestPurchase = (team.cheapestPurchase === 0 || !team.cheapestPurchase) ? finalPrice : Math.min(team.cheapestPurchase, finalPrice);

        await dataLayer.saveTeam(team);

        // Reset auction state
        state.currentPlayer = null;
        state.status = 'idle';
        state.currentBid = 0;
        state.leadingTeam = null;
        state.timerRemaining = state.timerDuration || 120;
        await dataLayer.saveAuctionState(state);

        // Notify
        const updatedState = await dataLayer.getFullAuctionState();
        const updatedTeams = await dataLayer.getAllTeamsPopulated();

        io.to('general').emit('auction:state', updatedState);
        io.to('general').emit('teams:update', updatedTeams);
        broadcastPlayerRefresh(io);
        
        io.to(`team:${team._id}`).emit('team:notification', {
          type: 'success',
          message: `Congratulations! You purchased ${player.name} for ₹${(finalPrice / 10000000).toFixed(2)} Cr!`
        });

        io.to('general').emit('auction:log', {
          type: 'success',
          message: `SOLD! ${player.name} is sold to ${team.teamName} for ₹${(finalPrice / 10000000).toFixed(2)} Cr.`
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to mark player as sold');
      }
    });

    // 5. Mark Player Unsold
    socket.on('admin:mark-unsold', async () => {
      if (socket.user.role !== 'admin') return;

      try {
        stopTimer();

        const state = await dataLayer.getAuctionState();
        if (!state.currentPlayer) {
          return socket.emit('error', 'No player currently up for auction');
        }

        const playerId = isDemoMode ? state.currentPlayer : state.currentPlayer;
        const player = await dataLayer.findPlayerById(playerId);
        if (!player) {
          return socket.emit('error', 'Player not found');
        }

        player.status = 'unsold';
        player.currentBid = 0;
        player.leadingTeam = null;
        await dataLayer.savePlayer(player);

        state.currentPlayer = null;
        state.status = 'idle';
        state.currentBid = 0;
        state.leadingTeam = null;
        state.timerRemaining = state.timerDuration || 120;
        await dataLayer.saveAuctionState(state);

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:log', {
          type: 'info',
          message: `Player ${player.name} went UNSOLD.`
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to mark player as unsold');
      }
    });

    // 6. Skip Player
    socket.on('admin:skip-player', async () => {
      if (socket.user.role !== 'admin') return;

      try {
        stopTimer();

        const state = await dataLayer.getAuctionState();
        if (!state.currentPlayer) {
          return socket.emit('error', 'No player currently up for auction');
        }

        const playerId = isDemoMode ? state.currentPlayer : state.currentPlayer;
        const player = await dataLayer.findPlayerById(playerId);
        if (!player) {
          return socket.emit('error', 'Player not found');
        }

        player.status = 'pending';
        player.currentBid = 0;
        player.leadingTeam = null;
        await dataLayer.savePlayer(player);

        state.currentPlayer = null;
        state.status = 'idle';
        state.currentBid = 0;
        state.leadingTeam = null;
        state.timerRemaining = state.timerDuration || 120;
        await dataLayer.saveAuctionState(state);

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:log', {
          type: 'info',
          message: `Player ${player.name} was skipped and returned to the pool.`
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to skip player');
      }
    });

    // 7. End Auction
    socket.on('admin:end-auction', async () => {
      if (socket.user.role !== 'admin') return;

      try {
        stopTimer();

        const state = await dataLayer.getAuctionState();
        state.currentPlayer = null;
        state.status = 'ended';
        state.currentBid = 0;
        state.leadingTeam = null;
        await dataLayer.saveAuctionState(state);

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:log', {
          type: 'success',
          message: 'The SPEC IPL AUCTION 2026 has concluded! Check out the final leaderboard.'
        });
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to end auction');
      }
    });

    // --- TEAM EVENTS ---

    // 8. Place Bid
    socket.on('team:bid', async ({ increment, customAmount }) => {
      if (socket.user.role !== 'team') {
        return socket.emit('error', 'Only franchise teams can bid');
      }

      try {
        const teamId = socket.user.id;
        const state = await dataLayer.getAuctionState();

        if (state.status !== 'active' || !state.currentPlayer) {
          return socket.emit('error', 'Auction is not active for bidding');
        }

        if (state.leadingTeam && state.leadingTeam.toString() === teamId.toString()) {
          return socket.emit('error', 'You are already the leading bidder!');
        }

        const team = await dataLayer.findTeamById(teamId);
        const currentPlayerId = isDemoMode ? state.currentPlayer : state.currentPlayer;
        const player = await dataLayer.findPlayerById(currentPlayerId);

        if (!team || !player) {
          return socket.emit('error', 'Invalid player or team context');
        }

        const isFirstBid = !state.leadingTeam;
        let nextBid;
        if (customAmount) {
          nextBid = customAmount;
          if (nextBid <= state.currentBid) {
            return socket.emit('error', `Custom bid must be higher than current bid of ₹${(state.currentBid / 10000000).toFixed(2)} Cr`);
          }
          if (isFirstBid && nextBid < player.basePrice) {
            return socket.emit('error', `First bid must be at least the base price of ₹${(player.basePrice / 10000000).toFixed(2)} Cr`);
          }
        } else {
          nextBid = isFirstBid ? player.basePrice : (state.currentBid + increment);
        }

        if (team.remainingPurse < nextBid) {
          return socket.emit('error', `Insufficient purse! Next bid requires ₹${(nextBid / 10000000).toFixed(2)} Cr, you have ₹${(team.remainingPurse / 10000000).toFixed(2)} Cr.`);
        }

        const previousLeader = state.leadingTeam;

        state.currentBid = nextBid;
        state.leadingTeam = team._id;
        state.timerRemaining = state.timerDuration || 120;
        await dataLayer.saveAuctionState(state);

        player.currentBid = nextBid;
        player.leadingTeam = team._id;
        await dataLayer.savePlayer(player);

        // Log bid
        const bidEntry = await dataLayer.createBidHistory({
          player: player._id,
          team: team._id,
          bidAmount: nextBid
        });

        // For demo mode, maintain in-memory bid history
        if (isDemoMode) {
          demoBidHistory.unshift({
            ...bidEntry,
            team: { _id: team._id, teamName: team.teamName, logo: team.logo }
          });
          demoBidHistory = demoBidHistory.slice(0, 20);
        }

        const bids = isDemoMode ? demoBidHistory : await dataLayer.getBidHistory(player._id);
        const updatedState = await dataLayer.getFullAuctionState();

        io.to('general').emit('auction:state', updatedState);
        io.to('general').emit('auction:bid-history', bids);
        broadcastPlayerRefresh(io);
        
        io.to('general').emit('auction:log', {
          type: 'bid',
          message: `${team.teamName} bids ₹${(nextBid / 10000000).toFixed(2)} Cr (+₹${(increment / 10000000).toFixed(2)} Cr)`
        });

        socket.emit('team:notification', {
          type: 'info',
          message: 'You are now leading the bid!'
        });

        if (previousLeader) {
          io.to(`team:${previousLeader}`).emit('team:notification', {
            type: 'warning',
            message: `You have been outbid for ${player.name}! Current bid is ₹${(nextBid / 10000000).toFixed(2)} Cr.`
          });
        }

        startTimer(io);
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Failed to place bid');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

// Timer functions
const startTimer = (io) => {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(async () => {
    try {
      const state = await dataLayer.getAuctionState();
      if (!state || state.status !== 'active') {
        clearInterval(timerInterval);
        return;
      }

      if (state.timerRemaining > 0) {
        state.timerRemaining -= 1;
        await dataLayer.saveAuctionState(state);
        io.to('general').emit('auction:timer', { timerRemaining: state.timerRemaining });
      } else {
        clearInterval(timerInterval);
        state.status = 'paused';
        await dataLayer.saveAuctionState(state);

        const updatedState = await dataLayer.getFullAuctionState();
        io.to('general').emit('auction:state', updatedState);
        broadcastPlayerRefresh(io);
        io.to('general').emit('auction:timeup', { message: 'Bidding time is up!' });
        io.to('general').emit('auction:log', {
          type: 'warning',
          message: 'Countdown timer has ended! Awaiting administrator decision.'
        });
      }
    } catch (err) {
      console.error('Timer tick error:', err.message);
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

module.exports = { initSocket };
