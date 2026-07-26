# CMS Import Folder

Drop your roster files and player/team images here.

Expected files:

- `players.json`
- `teams.json`
- `images/` for player portraits
- `logos/` for team logos

Supported JSON fields:

Players:

- `name`
- `country`
- `iplTeam`
- `role`
- `battingStyle`
- `bowlingStyle`
- `matches`
- `runs`
- `strikeRate`
- `average`
- `wickets`
- `economy`
- `dismissals`
- `performanceRating`
- `basePrice`
- `image`, `photo`, or `photoUrl`

Teams:

- `username`
- `teamName`
- `logo`, `logoUrl`, `teamLogo`, or `image`
- `initialPurse`
- `remainingPurse`

Use relative paths like `/content/images/virat-kohli.jpg`.