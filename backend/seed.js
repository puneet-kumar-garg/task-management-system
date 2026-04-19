require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

const users = [
  { name: 'Puneet',  email: 'puneet@taskflow.com',  password: 'puneet123'  },
  { name: 'Adarsh',  email: 'adarsh@taskflow.com',  password: 'adarsh123'  },
  { name: 'Riya',    email: 'riya@taskflow.com',    password: 'riya123'    },
  { name: 'Saurav',  email: 'saurav@taskflow.com',  password: 'saurav123'  },
];

async function seed() {
  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 12);
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [user.name, user.email, hashed]
    );
    console.log(`✅  Created: ${user.name}  |  ${user.email}  |  password: ${user.password}`);
  }
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
