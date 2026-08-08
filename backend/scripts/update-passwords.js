const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Team = require('../models/Team');
const { teamsData } = require('./seed');

const updatePasswords = async () => {
  try {
    await connectDB();
    console.log('Updating team passwords...');

    const salt = await bcrypt.genSalt(10);

    for (const t of teamsData) {
      if (t.password) {
        const passwordHash = await bcrypt.hash(t.password, salt);
        await Team.findOneAndUpdate(
          { username: t.username },
          { password: passwordHash }
        );
        console.log(`Updated password for ${t.teamName}`);
      }
    }

    console.log('All passwords updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
};

updatePasswords();
