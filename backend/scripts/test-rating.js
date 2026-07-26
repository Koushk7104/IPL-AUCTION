const { performance } = require('perf_hooks');

// Mimic rating formula from seed.js
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

  rating = Math.min(Math.max(rating, 60), 99);

  let basePrice = 30000000;
  if (rating >= 95) basePrice = 200000000;
  else if (rating >= 90) basePrice = 150000000;
  else if (rating >= 85) basePrice = 100000000;
  else if (rating >= 80) basePrice = 75000000;
  else if (rating >= 70) basePrice = 50000000;

  return { rating, basePrice };
}

// Test cases
const tests = [
  {
    name: 'Virat Kohli',
    role: 'Batter',
    runs: 741,
    strikeRate: 154.7,
    average: 61.75,
    expectedRatingMin: 90
  },
  {
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    wickets: 20,
    economy: 6.48,
    expectedRatingMin: 80
  },
  {
    name: 'Sanju Samson',
    role: 'Wicket Keeper',
    runs: 531,
    strikeRate: 153.4,
    average: 48.27,
    dismissals: 16,
    expectedRatingMin: 85
  },
  {
    name: 'Ravindra Jadeja',
    role: 'All-Rounder',
    runs: 267,
    strikeRate: 142.7,
    average: 44.5,
    wickets: 8,
    economy: 7.85,
    expectedRatingMin: 70
  }
];

console.log('Running Rating Calculation Validation Tests...');
let passed = true;

tests.forEach((t) => {
  const result = calculateRatingAndBasePrice(t);
  const basePriceCr = (result.basePrice / 10000000).toFixed(2);
  console.log(`- ${t.name} (${t.role}): Calculated Rating = ${result.rating}, Base Price = ₹${basePriceCr} Cr`);
  
  if (result.rating < t.expectedRatingMin) {
    console.error(`  FAIL: Expected rating >= ${t.expectedRatingMin}, got ${result.rating}`);
    passed = false;
  } else {
    console.log(`  PASS`);
  }
});

if (passed) {
  console.log('ALL RATING CALCULATIONS COMPLETED AND VALIDATED CORRECTLY!');
  process.exit(0);
} else {
  console.error('TESTS FAILED!');
  process.exit(1);
}
