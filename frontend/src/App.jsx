import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeamDashboard from './components/TeamDashboard';
import PublicDisplay from './components/PublicDisplay';
import Leaderboard from './components/Leaderboard';
import SoldOverlay from './components/SoldOverlay';
import { LogOut, Trophy, ScreenShare, LayoutDashboard, Zap, Shield, Swords } from 'lucide-react';

function AppContent() {
  const { user, token, loading, logout, auctionStage, soldAnimation, unsoldAnimation, teams } = useSocket();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-ipl-dark flex flex-col justify-center items-center">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-ipl-gold/20 border-t-ipl-gold rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-b-ipl-purple/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-ipl-gold font-bold animate-pulse">
          Entering Auction Arena...
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return <Login />;
  }

  const isLive = auctionStage === 'bidding' || auctionStage === 'displaying';

  return (
    <div className="min-h-screen bg-ipl-dark flex flex-col">
      {/* Premium Navbar */}
      <nav className="bg-ipl-card/95 backdrop-blur-xl border-b border-white/5 py-2.5 px-4 md:px-6 sticky top-0 z-40 shadow-card-elevated">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-3">
          
          {/* Brand header */}
          <div className="flex items-center space-x-3">
            <div className="gold-gradient w-1 h-8 rounded-full"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black title-font tracking-wider text-white uppercase">SPEC IPL AUCTION 2026</span>
                {isLive && (
                  <span className="live-indicator live-indicator-active">
                    <span className="live-indicator-dot"></span>
                    LIVE
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[9px] text-ipl-goldLight font-bold uppercase tracking-[0.2em] -mt-0.5">
                Mega Auction 2026
              </span>
            </div>
          </div>

          {/* Nav Tab Controls */}
          {user.role === 'admin' && (
            <div className="flex items-center space-x-1 bg-ipl-dark/70 border border-white/5 p-1 rounded-xl">
              <NavTab 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')}
                icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                label="Dashboard"
              />
              <NavTab 
                active={currentView === 'display'} 
                onClick={() => setCurrentView('display')}
                icon={<ScreenShare className="w-3.5 h-3.5" />}
                label="Projector"
              />
              <NavTab 
                active={currentView === 'leaderboard'} 
                onClick={() => setCurrentView('leaderboard')}
                icon={<Trophy className="w-3.5 h-3.5" />}
                label="Standings"
              />
            </div>
          )}

          {/* User Details & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2.5 bg-ipl-dark/50 border border-white/5 rounded-xl px-3 py-1.5">
              {user.role === 'admin' ? (
                <Shield className="w-4 h-4 text-ipl-gold" />
              ) : (
                <>
                  {user.logo && <img src={user.logo} alt="" className="w-5 h-5 rounded-full" />}
                  <Swords className="w-3.5 h-3.5 text-ipl-goldLight" />
                </>
              )}
              <div className="text-right">
                <span className="text-[9px] text-ipl-gray block leading-none">
                  {user.role === 'admin' ? 'Auctioneer' : 'Franchise'}
                </span>
                <strong className="text-[11px] text-white uppercase leading-tight">{user.teamName || 'Admin'}</strong>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 bg-white/5 border border-white/5 hover:border-red-500/40 hover:bg-red-500/10 text-ipl-gray hover:text-red-400 rounded-lg transition duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </nav>

      {/* Live Auction Ticker Strip */}
      {isLive && (
        <div className="gold-gradient-horizontal animate-shimmer h-[2px] w-full"></div>
      )}

      {/* Full-Screen Celebration Sold Overlay */}
      <SoldOverlay soldAnimation={soldAnimation} unsoldAnimation={unsoldAnimation} teams={teams} user={user} />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          user.role === 'admin' 
            ? <AdminDashboard setGlobalView={setCurrentView} /> 
            : <TeamDashboard />
        )}
        
        {currentView === 'display' && (
          <PublicDisplay />
        )}

        {currentView === 'leaderboard' && (
          <Leaderboard />
        )}
      </main>
    </div>
  );
}

function NavTab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition duration-200 ${
        active
          ? 'bg-ipl-gold text-ipl-dark shadow-gold-glow'
          : 'text-ipl-gray hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
