const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Correction: Requête SQL sans commentaires internes
    const [userRows] = await db.query(`
      SELECT 
        u.id, 
        u.nom, 
        u.prenom, 
        u.email, 
        u.mot_de_passe,
        u.role_id, 
        u.departement_id, 
        u.actif,
        r.nom AS role_nom,
        GROUP_CONCAT(CONCAT(p.action, ':', p.ressource)) AS permissions_str
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = ?
      GROUP BY u.id
    `, [email]);
    
    if (userRows.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    const user = userRows[0];
    
    // Vérification que le mot de passe haché existe
    if (!user.mot_de_passe) {
      console.error('Aucun mot de passe trouvé pour l\'utilisateur:', user.email);
      return res.status(500).json({ message: 'Erreur de configuration du compte' });
    }
    
    const isMatch = await bcrypt.compare(password, user.mot_de_passe);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    const token = jwt.sign(
      { id: user.id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Cloner l'utilisateur avant de supprimer le mot de passe
    const userResponse = { ...user };
    delete userResponse.mot_de_passe;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Erreur de login:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};