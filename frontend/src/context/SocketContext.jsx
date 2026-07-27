import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
axios.defaults.baseURL = BACKEND_URL;

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auction & Real-time State
  const [auctionState, setAuctionState] = useState({
    currentPlayer: null,
    status: 'idle',
    currentBid: 0,
    leadingTeam: null,
    timerRemaining: 120,
    timerDuration: 120
  });
  const [teams, setTeams] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notification, setNotification] = useState(null);
  const [playersVersion, setPlayersVersion] = useState(0);
  const [teamsVersion, setTeamsVersion] = useState(0);

  // Enhanced stage tracking for UI animations
  const [soldAnimation, setSoldAnimation] = useState(null); // { playerName, teamName, price } or null
  const [unsoldAnimation, setUnsoldAnimation] = useState(null); // { playerName } or null

  // Derived auction stage for granular UI control:
  // 'idle' | 'displaying' | 'bidding' | 'paused' | 'timeup' | 'ended'
  const auctionStage = useMemo(() => {
    if (auctionState.status === 'ended') return 'ended';
    if (!auctionState.currentPlayer) return 'idle';
    if (auctionState.status === 'idle') return 'displaying'; // Player selected but timer not started
    if (auctionState.status === 'active') return 'bidding';
    if (auctionState.status === 'paused') return 'paused';
    return 'idle';
  }, [auctionState.status, auctionState.currentPlayer]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user profile if token is present
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await axios.get('/api/auth/me');
        setUser(data);
      } catch (err) {
        console.error('Failed to authenticate token:', err.response?.data?.message || err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Connect to Socket.IO when token is authenticated
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(BACKEND_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('auction:state', (state) => {
      setAuctionState(state);
      // Clear sold/unsold animations when new player is selected or state resets
      if (state.currentPlayer) {
        setSoldAnimation(null);
        setUnsoldAnimation(null);
      }
    });

    newSocket.on('auction:timer', ({ timerRemaining }) => {
      setAuctionState((prev) => ({ ...prev, timerRemaining }));
    });

    newSocket.on('teams:update', (updatedTeams) => {
      setTeams(updatedTeams);
      setTeamsVersion((prev) => prev + 1);
      // If logged in as a team, refresh local user object to sync remainingPurse & squad
      if (user && user.role === 'team') {
        const myUpdatedTeam = updatedTeams.find((t) => t._id === user.id);
        if (myUpdatedTeam) {
          setUser((prev) => ({
            ...prev,
            remainingPurse: myUpdatedTeam.remainingPurse,
            squad: myUpdatedTeam.squad,
            squadStrength: myUpdatedTeam.squadStrength,
            roleCounts: myUpdatedTeam.roleCounts,
            avgRating: myUpdatedTeam.avgRating,
            highestPurchase: myUpdatedTeam.highestPurchase,
            cheapestPurchase: myUpdatedTeam.cheapestPurchase
          }));
        }
      }
    });

    newSocket.on('auction:bid-history', (history) => {
      setBidHistory(history);
    });

    newSocket.on('players:update', () => {
      setPlayersVersion((prev) => prev + 1);
    });

    newSocket.on('auction:log', (log) => {
      setLogs((prev) => [log, ...prev].slice(0, 100)); // Cap logs at 100 entries

      // Detect sold/unsold events for animations
      if (log.type === 'success' && log.message.includes('SOLD!')) {
        // Parse "SOLD! PlayerName is sold to TeamName for ₹X.XX Cr."
        const soldMatch = log.message.match(/SOLD! (.+) is sold to (.+) for (₹.+)/);
        if (soldMatch) {
          setSoldAnimation({
            playerName: soldMatch[1],
            teamName: soldMatch[2],
            price: soldMatch[3]
          });
          // Auto-clear after 4 seconds
          setTimeout(() => setSoldAnimation(null), 4000);
        }
      }
      if (log.type === 'info' && log.message.includes('went UNSOLD')) {
        const unsoldMatch = log.message.match(/Player (.+) went UNSOLD/);
        if (unsoldMatch) {
          setUnsoldAnimation({ playerName: unsoldMatch[1] });
          setTimeout(() => setUnsoldAnimation(null), 3000);
        }
      }
    });

    newSocket.on('team:notification', (notif) => {
      setNotification(notif);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotification(null), 5000);
      // Play a quick notice beep if sound is allowed
      try {
        const audio = new Audio(notif.type === 'warning' ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav' : 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
        audio.volume = 0.3;
        audio.play();
      } catch (e) {
        // ignore autoplay restriction
      }
    });

    newSocket.on('auction:timeup', (timeup) => {
      setNotification({ type: 'warning', message: timeup.message });
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav'); // buzzer
        audio.volume = 0.3;
        audio.play();
      } catch (e) {}
    });

    newSocket.on('error', (errMessage) => {
      setNotification({ type: 'error', message: errMessage });
    });

    newSocket.on('auction:reset', () => {
      window.location.reload();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  // Auth Operations
  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setLogs([]);
    setBidHistory([]);
    setSoldAnimation(null);
    setUnsoldAnimation(null);
  };

  // --- Real-time Actions ---

  // Admin Controls
  const selectPlayer = (playerId) => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:select-player', { playerId });
    }
  };

  const startAuction = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:start-auction');
    }
  };

  const pauseAuction = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:pause-auction');
    }
  };

  const resumeAuction = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:resume-auction');
    }
  };

  const markSold = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:mark-sold');
    }
  };

  const markUnsold = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:mark-unsold');
    }
  };

  const skipPlayer = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:skip-player');
    }
  };

  const endAuction = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:end-auction');
    }
  };

  const resetAuction = () => {
    if (socket && user?.role === 'admin') {
      socket.emit('admin:reset-auction');
    }
  };

  // Team Bid
  const placeBid = (increment, customAmount) => {
    if (socket && user?.role === 'team') {
      socket.emit('team:bid', { increment, customAmount });
    }
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return (
    <SocketContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        auctionState,
        auctionStage,
        teams,
        bidHistory,
        logs,
        notification,
        playersVersion,
        teamsVersion,
        soldAnimation,
        unsoldAnimation,
        clearNotification,
        // Admin commands
        selectPlayer,
        startAuction,
        pauseAuction,
        resumeAuction,
        markSold,
        markUnsold,
        skipPlayer,
        endAuction,
        resetAuction,
        // Team commands
        placeBid
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
