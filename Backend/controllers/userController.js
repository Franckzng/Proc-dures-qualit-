const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, nom, prenom, email, role_id, departement_id, actif FROM utilisateurs');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, role_id, departement_id } = req.body;
    
    const [existing] = await db.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await db.query(
      'INSERT INTO utilisateurs SET ?',
      { nom, prenom, email, mot_de_passe: hashedPassword, role_id, departement_id }
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    await db.query(
      'UPDATE utilisateurs SET actif = ? WHERE id = ?',
      [active, id]
    );
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};