const fs = require('fs');
const path = require('path');
const { playersRaw, calculateRatingAndBasePrice } = require('./seed');

const datasetRoot = path.resolve(__dirname, '../../IPL-DATASET/csv');
const outputDir = path.resolve(__dirname, '../content');
const matchJsonDir = path.resolve(__dirname, '../../IPL-DATASET/json/ipl_match');
const currentFranchises = new Set([
  'Mumbai Indians',
  'Chennai Super Kings',
  'Delhi Capitals',
  'Kolkata Knight Riders',
  'Punjab Kings',
  'Rajasthan Royals',
  'Royal Challengers Bengaluru',
  'Sunrisers Hyderabad',
  'Lucknow Super Giants',
  'Gujarat Titans'
]);

const playersCsvPath = process.env.IPL_PLAYERS_CSV || path.join(datasetRoot, '2024_players_details.csv');
const teamsCsvPath = process.env.IPL_TEAMS_CSV || path.join(datasetRoot, 'teams_info.csv');

const readCsv = (filePath) => {
  const text = fs.readFileSync(filePath, 'utf8').trim();
  const lines = text.split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());

  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value) => {
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const normalizeName = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const parseDate = (value) => {
  const timestamp = Date.parse(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const normalizeTeamName = (teamName) => {
  const value = String(teamName || '').trim();
  const replacements = {
    'Kolkata Knight Respn_iders': 'Kolkata Knight Riders',
    'Royal Challengers Bangalore': 'Royal Challengers Bengaluru',
    'Kings XI Punjab': 'Punjab Kings',
    'Delhi Daredevils': 'Delhi Capitals',
    'Rising Pune Supergiant': 'Rising Pune Supergiants'
  };

  return replacements[value] || value;
};

const buildPlayerRecords = (rows, teamsByName) => rows.map((row) => {
  const teamName = normalizeTeamName(row.iplTeam);
  const team = teamsByName.get(teamName) || null;
  const role = mapRole(row.playingRoles);
  const playerKey = normalizeName(row.longName || row.Name || row.battingName || row.fieldingName);
  const legacyStats = legacyPlayerMap.get(playerKey);
  const mappedTeamInfo = playerTeamMap.get(playerKey);
  const mappedTeamName = mappedTeamInfo?.teamName || teamName;
  const mappedTeam = teamsByName.get(mappedTeamName) || team;
  const statSource = legacyStats || row;
  const ratingSource = legacyStats || {
    role,
    runs: 0,
    strikeRate: 0,
    average: 0,
    wickets: 0,
    economy: 0,
    dismissals: 0
  };
  const ratingResult = calculateRatingAndBasePrice(ratingSource);

  return {
    id: row.ID,
    name: row.longName || row.Name || row.battingName || row.fieldingName,
    shortName: row.Name,
    country: inferCountry(row.espn_url),
    iplTeam: mappedTeamName || 'Uncapped',
    teamLogo: mappedTeam?.logo || '',
    role,
    battingStyle: row.longBattingStyles || row.battingStyles || 'Right-hand bat',
    bowlingStyle: row.longBowlingStyles || row.bowlingStyles || 'N/A',
    matches: toNumber(statSource.matches || statSource.Match || statSource.appearances, 0),
    runs: toNumber(statSource.runs || statSource.Runs, 0),
    strikeRate: toNumber(statSource.strikeRate || statSource.SR || statSource.strike_rate, 0),
    average: toNumber(statSource.average || statSource.Avg || statSource.battingAverage, 0),
    wickets: toNumber(statSource.wickets || statSource.Wickets, 0),
    economy: toNumber(statSource.economy || statSource.Econ || statSource.economyRate, 0),
    dismissals: toNumber(statSource.dismissals || statSource.catches || statSource.stumpings, 0),
    image: row.imgUrl,
    espnUrl: row.espn_url,
    status: 'pending',
    currentBid: 0,
    leadingTeam: null,
    soldPrice: null,
    buyerTeam: null,
    performanceRating: ratingResult.rating,
    basePrice: ratingResult.basePrice,
    hasPhoto: toBoolean(row.imgUrl)
  };
});

const buildTeamRecords = (rows) => {
  const uniqueTeams = new Map();

  rows.forEach((row) => {
    const teamName = normalizeTeamName(row.team_name);

    if (!currentFranchises.has(teamName) || uniqueTeams.has(teamName)) {
      return;
    }

    uniqueTeams.set(teamName, {
      username: slugifyTeamName(teamName),
      teamName,
      logo: row.url,
      espnId: row.espn_id,
      initialPurse: 1250000000,
      remainingPurse: 1250000000,
      roleCounts: {
        batters: 0,
        bowlers: 0,
        allRounders: 0,
        wicketKeepers: 0
      },
      squad: []
    });
  });

  return Array.from(uniqueTeams.values());
};

const buildPlayerAliasMap = (rows) => {
  const aliasMap = new Map();

  rows.forEach((row) => {
    const canonical = row.longName || row.Name || row.battingName || row.fieldingName;
    [row.longName, row.Name, row.battingName, row.fieldingName]
      .filter(Boolean)
      .forEach((alias) => {
        aliasMap.set(normalizeName(alias), canonical);
      });
  });

  return aliasMap;
};

const buildPlayerTeamMap = (aliasMap) => {
  const playerTeams = new Map();

  if (!fs.existsSync(matchJsonDir)) {
    return playerTeams;
  }

  const files = fs.readdirSync(matchJsonDir).filter((file) => file.endsWith('.json'));

  files.forEach((file) => {
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(matchJsonDir, file), 'utf8'));
      const info = payload.info || {};
      const teams = info.teams || [];
      const players = info.players || {};
      const matchDate = parseDate(info.dates);

      teams.forEach((teamName) => {
        const normalizedTeam = normalizeTeamName(teamName);
        if (!currentFranchises.has(normalizedTeam)) {
          return;
        }

        const roster = players[teamName] || players[normalizedTeam] || [];

        roster.forEach((playerName) => {
          const playerKey = normalizeName(playerName);
          const canonicalPlayer = aliasMap.get(playerKey);
          if (!canonicalPlayer) {
            return;
          }

          const existing = playerTeams.get(normalizeName(canonicalPlayer));
          if (!existing || matchDate >= existing.matchDate) {
            playerTeams.set(normalizeName(canonicalPlayer), {
              teamName: normalizedTeam,
              matchDate
            });
          }
        });
      });
    } catch (error) {
      // Skip malformed files.
    }
  });

  return playerTeams;
};

const legacyPlayerMap = new Map(
  playersRaw.map((player) => [
    normalizeName(player.name),
    player
  ])
);

const mapRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized.includes('wicket')) return 'Wicket Keeper';
  if (normalized.includes('all')) return 'All-Rounder';
  if (normalized.includes('bowl')) return 'Bowler';
  return 'Batter';
};

const inferCountry = (espnUrl) => {
  const slug = String(espnUrl || '').split('/').filter(Boolean).pop() || '';
  const teamName = slug.replace(/-/g, ' ');
  if (/kohli|rahul|dhoni|jadeja|bumrah|pant|gaikwad|sharma|gill|jaiswal|karthik|chahal|yadav|patel|thakur|chahar|arshdeep|rahane|rinku|sudharsan|saha|sandeep|maxwell|stoinis|green|livingstone|head|starc|buttler|salt|pooran|klaasen|narine|russell|conway|santner|marsh|boult|rahman|pathirana/i.test(teamName)) {
    return 'India';
  }
  return 'Unknown';
};

const slugifyTeamName = (teamName) => String(teamName || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const ensureOutputDir = () => {
  fs.mkdirSync(outputDir, { recursive: true });
};

const main = () => {
  ensureOutputDir();

  const playerRows = readCsv(playersCsvPath);
  const teamRows = readCsv(teamsCsvPath);

  const teamRecords = buildTeamRecords(teamRows);
  const teamsByName = new Map(teamRecords.map((team) => [team.teamName, team]));
  const playerAliasMap = buildPlayerAliasMap(playerRows);
  playerTeamMap = buildPlayerTeamMap(playerAliasMap);
  const playerRecords = buildPlayerRecords(playerRows, teamsByName);

  const playerIndex = new Map(playerRecords.map((player) => [player.name, player]));

  teamRecords.forEach((team) => {
    const matchedPlayers = playerRecords.filter((player) => player.iplTeam === team.teamName);
    team.squad = matchedPlayers.map((player) => player.name);
  });

  fs.writeFileSync(path.join(outputDir, 'players.json'), `${JSON.stringify(playerRecords, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'teams.json'), `${JSON.stringify(teamRecords, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'player-index.json'), `${JSON.stringify(Array.from(playerIndex.keys()), null, 2)}\n`);

  console.log(`Wrote ${playerRecords.length} players and ${teamRecords.length} teams to ${outputDir}`);
};

let playerTeamMap = new Map();

main();