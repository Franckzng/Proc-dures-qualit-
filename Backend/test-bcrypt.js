const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  const [users] = await db.query('SELECT id, email FROM utilisateurs');
  
  for (const user of users) {
    const hash = await bcrypt.hash('admin', 10);
    await db.query('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?', [hash, user.id]);
    console.log(`Password reset for ${user.email}`);
  }
  
  console.log('All passwords reset to "admin"');
  process.exit();
}

resetPasswords();