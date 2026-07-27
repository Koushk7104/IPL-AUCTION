const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { teamsData, playersRaw, calculateRatingAndBasePrice, getAvatar } = require('../scripts/seed');

const adminUser = {
  id: 'admin',
  username: process.env.ADMIN_USERNAME || 'admin',
  role: 'admin',
  teamName: 'Administrator'
};

const TEAM_USERNAME_ALIASES = {
  'mumbai-indians': 'mi',
  'chennai-super-kings': 'csk',
  'royal-challengers-bengaluru': 'rcb',
  'kolkata-knight-riders': 'kkr',
  'rajasthan-royals': 'rr',
  'gujarat-titans': 'gt',
  'lucknow-super-giants': 'lsg',
  'delhi-capitals': 'dc',
  'sunrisers-hyderabad': 'srh',
  'punjab-kings': 'pbks'
};

const normalizeTeamUsername = (value) => {
  if (!value) {
    return '';
  }

  return String(value).trim().toLowerCase().replace(/\s+/g, '-');
};

const getTeamLookupKeys = (team) => {
  const username = normalizeTeamUsername(team.username || team.teamCode || team.shortCode || team.teamName || team.name);
  const teamNameSlug = normalizeTeamUsername(team.teamName || team.name);
  const alias = TEAM_USERNAME_ALIASES[username] || TEAM_USERNAME_ALIASES[teamNameSlug] || '';

  return [username, teamNameSlug, alias].filter(Boolean);
};

const contentDir = path.join(__dirname, '..', 'content');
const backendBaseUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000';

const loadJsonIfExists = (fileName) => {
  const filePath = path.join(contentDir, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const toAbsoluteAssetUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }

  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${backendBaseUrl}${normalized}`;
};

const loadManifestPlayers = () => loadJsonIfExists('players.json');
const loadManifestTeams = () => loadJsonIfExists('teams.json');

const buildDemoTeams = async () => {
  const manifestTeams = loadManifestTeams();
  if (Array.isArray(manifestTeams) && manifestTeams.length > 0) {
    return manifestTeams.map((team, index) => ({
      _id: team._id || `manifest-team-${index + 1}`,
      username: (team.username || team.teamCode || team.shortCode || `team-${index + 1}`).toLowerCase(),
      password: team.password || 'password123',
      teamName: team.teamName || team.name || `Team ${index + 1}`,
      logo: toAbsoluteAssetUrl(team.logo || team.logoUrl || team.teamLogo || team.image || ''),
      initialPurse: team.initialPurse || 2100000000,
      remainingPurse: team.remainingPurse || team.initialPurse || 2100000000,
      squad: team.squad || [],
      squadStrength: team.squadStrength || 0,
      avgRating: team.avgRating || 0,
      roleCounts: team.roleCounts || {
        batters: 0,
        bowlers: 0,
        allRounders: 0,
        wicketKeepers: 0
      },
      highestPurchase: team.highestPurchase || 0,
      cheapestPurchase: team.cheapestPurchase || 0
    }));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  return teamsData.map((team) => ({
    _id: `demo-${team.username}`,
    username: team.username,
    password: passwordHash,
    teamName: team.teamName,
    logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(team.username)}&backgroundColor=0b0f19&color=f5c453`,
    initialPurse: 2100000000,
    remainingPurse: 2100000000,
    squad: [],
    squadStrength: 0,
    avgRating: 0,
    roleCounts: {
      batters: 0,
      bowlers: 0,
      allRounders: 0,
      wicketKeepers: 0
    },
    highestPurchase: 0,
    cheapestPurchase: 0
  }));
};

const buildDemoPlayers = () => {
  const manifestPlayers = loadManifestPlayers();
  if (Array.isArray(manifestPlayers) && manifestPlayers.length > 0) {
    return manifestPlayers.map((player, index) => {
      const rating = Number(player.performanceRating || player.rating || 0);
      const basePrice = Number(player.basePrice || 0);

      return {
        _id: player._id || `manifest-player-${index + 1}`,
        name: player.name,
        country: player.country,
        iplTeam: player.iplTeam || player.teamCode || 'Uncapped',
        role: player.role,
        battingStyle: player.battingStyle || 'Right-hand bat',
        bowlingStyle: player.bowlingStyle || 'N/A',
        matches: Number(player.matches || 0),
        runs: Number(player.runs || 0),
        strikeRate: Number(player.strikeRate || 0),
        average: Number(player.average || 0),
        wickets: Number(player.wickets || 0),
        economy: Number(player.economy || 0),
        dismissals: Number(player.dismissals || 0),
        image: toAbsoluteAssetUrl(player.image || player.photo || player.photoUrl || player.imageUrl || ''),
        performanceRating: rating,
        basePrice,
        status: player.status || 'pending',
        currentBid: Number(player.currentBid || 0),
        leadingTeam: player.leadingTeam || null,
        soldPrice: player.soldPrice || null,
        buyerTeam: player.buyerTeam || null,
        createdAt: player.createdAt || new Date().toISOString(),
        updatedAt: player.updatedAt || new Date().toISOString()
      };
    });
  }

  return playersRaw.map((player, index) => {
    const { rating, basePrice } = calculateRatingAndBasePrice(player);
    return {
      _id: `demo-player-${index + 1}`,
      ...player,
      image: getAvatar(player.name),
      performanceRating: rating,
      basePrice,
      status: 'pending',
      currentBid: 0,
      leadingTeam: null,
      soldPrice: null,
      buyerTeam: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
};

const demoTeams = [];
const demoPlayers = buildDemoPlayers();
const demoAuctionState = {
  _id: 'demo-auction-state',
  currentPlayer: null,
  status: 'idle',
  currentBid: 0,
  leadingTeam: null,
  timerRemaining: 60,
  timerDuration: 60
};

const initDemoTeams = async () => {
  if (demoTeams.length === 0) {
    const teams = await buildDemoTeams();
    demoTeams.push(...teams);
  }

  return demoTeams;
};

const getDemoTeamByUsername = async (username) => {
  const teams = await initDemoTeams();
  const lookup = normalizeTeamUsername(username);

  return teams.find((team) => getTeamLookupKeys(team).includes(lookup)) || null;
};

const getDemoTeamById = async (id) => {
  const teams = await initDemoTeams();
  return teams.find((team) => team._id === id) || null;
};

const getDemoPlayerById = (id) => demoPlayers.find((player) => player._id === id) || null;

const getDemoPlayers = (filter = {}) => {
  return demoPlayers.filter((player) => {
    if (filter.role && player.role !== filter.role) return false;
    if (filter.status && player.status !== filter.status) return false;
    return true;
  }).map((player) => ({ ...player }));
};

const getDemoTeams = async () => {
  const teams = await initDemoTeams();
  return teams.map((team) => ({
    ...team,
    squad: team.squad.map((playerId) => getDemoPlayerById(playerId)).filter(Boolean)
  }));
};

const getDemoLeaderboard = async () => {
  const teams = await getDemoTeams();
  return teams.map((t) => {
    const squadCount = t.squad?.length || 0;
    const isQualified = squadCount >= 15;
    return {
      ...t,
      isQualified,
      disqualifiedReason: isQualified ? null : `Incomplete squad (${squadCount}/15 players)`
    };
  }).sort((a, b) => {
    if (a.isQualified !== b.isQualified) {
      return a.isQualified ? -1 : 1;
    }
    if (b.squadStrength !== a.squadStrength) return b.squadStrength - a.squadStrength;
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.remainingPurse - a.remainingPurse;
  });
};

const getDemoCurrentState = async () => {
  if (!demoAuctionState.currentPlayer) {
    return { ...demoAuctionState, currentPlayer: null, leadingTeam: null };
  }

  const currentPlayer = getDemoPlayerById(demoAuctionState.currentPlayer);
  const leadingTeam = demoAuctionState.leadingTeam ? await getDemoTeamById(demoAuctionState.leadingTeam) : null;

  return {
    ...demoAuctionState,
    currentPlayer,
    leadingTeam: leadingTeam ? { _id: leadingTeam._id, teamName: leadingTeam.teamName, logo: leadingTeam.logo } : null
  };
};

const getDemoMe = async (user) => {
  if (!user) return null;

  if (user.role === 'admin') {
    return { ...adminUser };
  }

  const team = await getDemoTeamById(user.id) || await getDemoTeamByUsername(user.username);
  if (!team) return null;

  return {
    id: team._id,
    username: team.username,
    role: 'team',
    teamName: team.teamName,
    logo: team.logo,
    initialPurse: team.initialPurse,
    remainingPurse: team.remainingPurse,
    squad: team.squad.map((playerId) => getDemoPlayerById(playerId)).filter(Boolean),
    squadStrength: team.squadStrength,
    roleCounts: team.roleCounts,
    avgRating: team.avgRating,
    highestPurchase: team.highestPurchase,
    cheapestPurchase: team.cheapestPurchase
  };
};

module.exports = {
  adminUser,
  demoPlayers,
  demoTeams,
  demoAuctionState,
  getDemoTeamByUsername,
  getDemoTeamById,
  getDemoPlayers,
  getDemoTeams,
  getDemoLeaderboard,
  getDemoCurrentState,
  getDemoMe
};