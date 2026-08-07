const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backend/content/players.json', 'utf8'));
let changed = 0;
data.forEach(p => {
    if (p.image && p.image.includes('lsciNone')) {
        p.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&color=fff&size=200`;
        changed++;
    }
});
fs.writeFileSync('backend/content/players.json', JSON.stringify(data, null, 2));
console.log(`Updated ${changed} players`);
