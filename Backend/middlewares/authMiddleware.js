//backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token non fourni' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur avec ses permissions
    const [userRows] = await db.query(`
      SELECT 
        u.id, 
        u.nom, 
        u.prenom, 
        u.email, 
        u.role_id, 
        u.departement_id, 
        u.actif,
        r.nom AS role_nom,
        GROUP_CONCAT(CONCAT(p.action, ':', p.ressource)) AS permissions_str
      FROM utilisateurs u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ?
      GROUP BY u.id
    `, [decoded.id]);

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userRows[0];
    
    // Convertir les permissions en objet
    user.permissions = {};
    if (user.permissions_str) {
      user.permissions_str.split(',').forEach(perm => {
        const [action, resource] = perm.split(':');
        if (action && resource) {
          if (!user.permissions[resource]) user.permissions[resource] = [];
          user.permissions[resource].push(action);
        }
      });
    }

    req.user = {
      id: user.id,
      role_id: user.role_id
    };
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ error: 'Authentification échouée' });
  }
};