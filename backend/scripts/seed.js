const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Team = require('../models/Team');
const Player = require('../models/Player');
const AuctionState = require('../models/AuctionState');
const BidHistory = require('../models/BidHistory');

// Function to calculate rating and base price based on rules
function calculateRatingAndBasePrice(player) {
  let rating = 70; // baseline
  const { role, runs, strikeRate, average, wickets, economy, dismissals } = player;

  if (role === 'Batter') {
    const normRuns = Math.min((runs / 600) * 100, 100);
    const normSR = Math.min((strikeRate / 160) * 100, 100);
    const normAvg = Math.min((average / 50) * 100, 100);
    rating = Math.round(normRuns * 0.4 + normSR * 0.3 + normAvg * 0.3);
  } else if (role === 'Bowler') {
    const normWickets = Math.min((wickets / 20) * 100, 100);
    const normEcon = Math.min(Math.max((12 - economy) / 5.0 * 100, 0), 100);
    rating = Math.round(normWickets * 0.6 + normEcon * 0.4);
  } else if (role === 'Wicket Keeper') {
    const normRuns = Math.min((runs / 550) * 100, 100);
    const normSR = Math.min((strikeRate / 160) * 100, 100);
    const normAvg = Math.min((average / 45) * 100, 100);
    const battingRating = normRuns * 0.4 + normSR * 0.3 + normAvg * 0.3;
    const normDismissals = Math.min((dismissals / 15) * 100, 100);
    rating = Math.round(battingRating * 0.8 + normDismissals * 0.2);
  } else if (role === 'All-Rounder') {
    const normRuns = Math.min((runs / 300) * 100, 100);
    const normSR = Math.min((strikeRate / 150) * 100, 100);
    const normAvg = Math.min((average / 35) * 100, 100);
    const batPart = normRuns * 0.4 + normSR * 0.3 + normAvg * 0.3;

    const normWickets = Math.min((wickets / 15) * 100, 100);
    const normEcon = Math.min(Math.max((12 - economy) / 4.5 * 100, 0), 100);
    const bowlPart = normWickets * 0.6 + normEcon * 0.4;

    rating = Math.round((batPart + bowlPart) / 2);
  }

  // Bound performance rating between 60 and 99
  rating = Math.min(Math.max(rating, 60), 99);

  // Map rating to base price
  let basePrice = 5000000; // default 0.50 Cr
  if (rating >= 90) {
    basePrice = 20000000; // 2.00 Cr
  } else if (rating > 75) {
    basePrice = 10000000; // 1.00 Cr
  }

  return { rating, basePrice };
}

// Generate premium avatar URI using dicebear
function getAvatar(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=d4af37,f5c453&textColor=0b0f19&bold=true`;
}

const teamsData = [
  { teamName: 'Mumbai Indians', username: 'mi', password: '9966555279' },
  { teamName: 'Chennai Super Kings', username: 'csk', password: '8978017616' },
  { teamName: 'Royal Challengers Bengaluru', username: 'rcb', password: '7416085085' },
  { teamName: 'Kolkata Knight Riders', username: 'kkr', password: '9393923889' },
  { teamName: 'Rajasthan Royals', username: 'rr', password: '7032678126' },
  { teamName: 'Gujarat Titans', username: 'gt', password: '8969049234' },
  { teamName: 'Lucknow Super Giants', username: 'lsg', password: '9989276475' },
  { teamName: 'Delhi Capitals', username: 'dc', password: '9121533491' },
  { teamName: 'Sunrisers Hyderabad', username: 'srh', password: '6302618426' },
  { teamName: 'Punjab Kings', username: 'pbks', password: '9392892120' }
];

const playersRaw = [
  // Batters
  {
    name: 'Virat Kohli',
    country: 'India',
    iplTeam: 'RCB',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    matches: 15,
    runs: 741,
    strikeRate: 154.7,
    average: 61.75
  },
  {
    name: 'Ruturaj Gaikwad',
    country: 'India',
    iplTeam: 'CSK',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 14,
    runs: 583,
    strikeRate: 141.2,
    average: 53.0
  },
  {
    name: 'Travis Head',
    country: 'Australia',
    iplTeam: 'SRH',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 15,
    runs: 567,
    strikeRate: 191.5,
    average: 40.5
  },
  {
    name: 'Yashasvi Jaiswal',
    country: 'India',
    iplTeam: 'RR',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    matches: 15,
    runs: 435,
    strikeRate: 155.9,
    average: 31.07
  },
  {
    name: 'Shubman Gill',
    country: 'India',
    iplTeam: 'GT',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 12,
    runs: 426,
    strikeRate: 147.4,
    average: 38.72
  },
  {
    name: 'Suryakumar Yadav',
    country: 'India',
    iplTeam: 'MI',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    matches: 11,
    runs: 345,
    strikeRate: 167.4,
    average: 34.5
  },
  {
    name: 'Rinku Singh',
    country: 'India',
    iplTeam: 'KKR',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 14,
    runs: 356,
    strikeRate: 148.6,
    average: 89.0
  },
  {
    name: 'Rohit Sharma',
    country: 'India',
    iplTeam: 'MI',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 14,
    runs: 417,
    strikeRate: 150.0,
    average: 32.07
  },
  {
    name: 'Sai Sudharsan',
    country: 'India',
    iplTeam: 'GT',
    role: 'Batter',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    matches: 12,
    runs: 527,
    strikeRate: 141.2,
    average: 47.9
  },
  {
    name: 'Harry Brook',
    country: 'England',
    iplTeam: 'DC',
    role: 'Batter',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    matches: 10,
    runs: 310,
    strikeRate: 165.5,
    average: 38.7
  },
  // Wicket Keepers
  {
    name: 'Heinrich Klaasen',
    country: 'South Africa',
    iplTeam: 'SRH',
    role: 'Wicket Keeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'N/A',
    matches: 15,
    runs: 479,
    strikeRate: 171.0,
    average: 39.9,
    dismissals: 15
  },
  {
    name: 'Sanju Samson',
    country: 'India',
    iplTeam: 'RR',
    role: 'Wicket Keeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'N/A',
    matches: 15,
    runs: 531,
    strikeRate: 153.4,
    average: 48.27,
    dismissals: 16
  },
  {
    name: 'Rishabh Pant',
    country: 'India',
    iplTeam: 'DC',
    role: 'Wicket Keeper',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'N/A',
    matches: 13,
    runs: 446,
    strikeRate: 155.4,
    average: 40.54,
    dismissals: 18
  },
  {
    name: 'Nicholas Pooran',
    country: 'West Indies',
    iplTeam: 'LSG',
    role: 'Wicket Keeper',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'N/A',
    matches: 14,
    runs: 499,
    strikeRate: 178.2,
    average: 62.37,
    dismissals: 12
  },
  {
    name: 'KL Rahul',
    country: 'India',
    iplTeam: 'LSG',
    role: 'Wicket Keeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'N/A',
    matches: 14,
    runs: 520,
    strikeRate: 136.1,
    average: 37.14,
    dismissals: 14
  },
  {
    name: 'Phil Salt',
    country: 'England',
    iplTeam: 'KKR',
    role: 'Wicket Keeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'N/A',
    matches: 12,
    runs: 435,
    strikeRate: 182.0,
    average: 39.5,
    dismissals: 10
  },
  {
    name: 'Jos Buttler',
    country: 'England',
    iplTeam: 'RR',
    role: 'Wicket Keeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'N/A',
    matches: 11,
    runs: 359,
    strikeRate: 140.7,
    average: 39.8,
    dismissals: 9
  },
  {
    name: 'MS Dhoni',
    country: 'India',
    iplTeam: 'CSK',
    role: 'Wicket Keeper',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'N/A',
    matches: 14,
    runs: 161,
    strikeRate: 220.5,
    average: 53.6,
    dismissals: 15
  },
  // Bowlers
  {
    name: 'Jasprit Bumrah',
    country: 'India',
    iplTeam: 'MI',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 13,
    wickets: 20,
    economy: 6.48
  },
  {
    name: 'Harshal Patel',
    country: 'India',
    iplTeam: 'PBKS',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium fast',
    matches: 14,
    wickets: 24,
    economy: 9.73
  },
  {
    name: 'Varun Chakaravarthy',
    country: 'India',
    iplTeam: 'KKR',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    matches: 14,
    wickets: 21,
    economy: 8.04
  },
  {
    name: 'Yuzvendra Chahal',
    country: 'India',
    iplTeam: 'RR',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    matches: 15,
    wickets: 18,
    economy: 9.41
  },
  {
    name: 'Kuldeep Yadav',
    country: 'India',
    iplTeam: 'DC',
    role: 'Bowler',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm wrist spin',
    matches: 11,
    wickets: 16,
    economy: 8.69
  },
  {
    name: 'Rashid Khan',
    country: 'Afghanistan',
    iplTeam: 'GT',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    matches: 12,
    wickets: 10,
    economy: 8.4
  },
  {
    name: 'Mitchell Starc',
    country: 'Australia',
    iplTeam: 'KKR',
    role: 'Bowler',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm fast',
    matches: 14,
    wickets: 17,
    economy: 10.61
  },
  {
    name: 'Matheesha Pathirana',
    country: 'Sri Lanka',
    iplTeam: 'CSK',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 6,
    wickets: 13,
    economy: 7.68
  },
  {
    name: 'Trent Boult',
    country: 'New Zealand',
    iplTeam: 'RR',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Left-arm fast medium',
    matches: 15,
    wickets: 16,
    economy: 8.3
  },
  {
    name: 'Arshdeep Singh',
    country: 'India',
    iplTeam: 'PBKS',
    role: 'Bowler',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm medium fast',
    matches: 14,
    wickets: 19,
    economy: 10.03
  },
  {
    name: 'Sandeep Sharma',
    country: 'India',
    iplTeam: 'RR',
    role: 'Bowler',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium fast',
    matches: 11,
    wickets: 13,
    economy: 8.18
  },
  // All-Rounders
  {
    name: 'Hardik Pandya',
    country: 'India',
    iplTeam: 'MI',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast medium',
    matches: 14,
    runs: 216,
    strikeRate: 143.0,
    average: 18.0,
    wickets: 11,
    economy: 10.75
  },
  {
    name: 'Ravindra Jadeja',
    country: 'India',
    iplTeam: 'CSK',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm orthodox',
    matches: 14,
    runs: 267,
    strikeRate: 142.7,
    average: 44.5,
    wickets: 8,
    economy: 7.85
  },
  {
    name: 'Sunil Narine',
    country: 'West Indies',
    iplTeam: 'KKR',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 14,
    runs: 488,
    strikeRate: 180.7,
    average: 34.85,
    wickets: 17,
    economy: 6.69
  },
  {
    name: 'Andre Russell',
    country: 'West Indies',
    iplTeam: 'KKR',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 14,
    runs: 222,
    strikeRate: 185.0,
    average: 31.7,
    wickets: 19,
    economy: 10.05
  },
  {
    name: 'Axar Patel',
    country: 'India',
    iplTeam: 'DC',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm orthodox',
    matches: 14,
    runs: 235,
    strikeRate: 131.2,
    average: 29.3,
    wickets: 11,
    economy: 7.65
  },
  {
    name: 'Abhishek Sharma',
    country: 'India',
    iplTeam: 'SRH',
    role: 'All-Rounder',
    battingStyle: 'Left-hand bat',
    bowlingStyle: 'Left-arm orthodox',
    matches: 15,
    runs: 484,
    strikeRate: 204.2,
    average: 32.26,
    wickets: 2,
    economy: 11.2
  },
  {
    name: 'Glenn Maxwell',
    country: 'Australia',
    iplTeam: 'RCB',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 10,
    runs: 52,
    strikeRate: 120.9,
    average: 5.7,
    wickets: 6,
    economy: 8.38
  },
  {
    name: 'Marcus Stoinis',
    country: 'Australia',
    iplTeam: 'LSG',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium fast',
    matches: 14,
    runs: 388,
    strikeRate: 147.5,
    average: 32.33,
    wickets: 4,
    economy: 9.0
  },
  {
    name: 'Cameron Green',
    country: 'Australia',
    iplTeam: 'RCB',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast medium',
    matches: 13,
    runs: 258,
    strikeRate: 143.3,
    average: 32.25,
    wickets: 10,
    economy: 8.61
  },
  {
    name: 'Liam Livingstone',
    country: 'England',
    iplTeam: 'PBKS',
    role: 'All-Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm legbreak',
    matches: 7,
    runs: 111,
    strikeRate: 162.8,
    average: 22.2,
    wickets: 3,
    economy: 9.9
  }
];

const seedDB = async ({ exit = true } = {}) => {
  try {
    await connectDB();

    console.log('Clearing old database collections...');
    await Team.deleteMany({});
    await Player.deleteMany({});
    await AuctionState.deleteMany({});
    await BidHistory.deleteMany({});

    console.log('Seeding Teams (Franchises)...');
    const salt = await bcrypt.genSalt(10);

    const createdTeams = [];
    for (const t of teamsData) {
      const passwordHash = await bcrypt.hash(t.password, salt);
      const team = new Team({
        teamName: t.teamName,
        username: t.username,
        password: passwordHash,
        logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(t.username)}&backgroundColor=0b0f19&color=f5c453`,
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
      });
      const savedTeam = await team.save();
      createdTeams.push(savedTeam);
    }
    console.log(`Successfully seeded ${createdTeams.length} teams.`);

    console.log('Seeding Players...');
    const seededPlayers = [];
    for (const p of playersRaw) {
      const { rating, basePrice } = calculateRatingAndBasePrice(p);
      const player = new Player({
        ...p,
        image: getAvatar(p.name),
        performanceRating: rating,
        basePrice: basePrice,
        status: 'pending',
        currentBid: 0,
        leadingTeam: null
      });
      const savedPlayer = await player.save();
      seededPlayers.push(savedPlayer);
    }
    console.log(`Successfully seeded ${seededPlayers.length} players with ratings and base prices.`);

    console.log('Initializing AuctionState...');
    const auctionState = new AuctionState({
      currentPlayer: null,
      status: 'idle',
      currentBid: 0,
      leadingTeam: null,
      timerRemaining: 60,
      timerDuration: 60
    });
    await auctionState.save();
    console.log('AuctionState initialized.');

    console.log('DB Seeding Completed Successfully!');
    if (exit) {
      process.exit(0);
    }

    return true;
  } catch (error) {
    console.error('Seeding script failed:', error);
    if (exit) {
      process.exit(1);
    }

    throw error;
  }
};

const ensureSeedData = async () => {
  const [teamCount, playerCount, auctionStateCount] = await Promise.all([
    Team.countDocuments(),
    Player.countDocuments(),
    AuctionState.countDocuments()
  ]);

  if (teamCount === 0 || playerCount === 0 || auctionStateCount === 0) {
    console.log('No auction demo data found. Bootstrapping seed data...');
    await seedDB({ exit: false });
    return true;
  }

  return false;
};

if (require.main === module) {
  seedDB();
} else {
  module.exports = { seedDB, ensureSeedData, calculateRatingAndBasePrice };
  module.exports.teamsData = teamsData;
  module.exports.playersRaw = playersRaw;
  module.exports.getAvatar = getAvatar;
}
