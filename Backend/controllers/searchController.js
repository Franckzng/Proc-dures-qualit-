const SearchService = require('../services/searchService');

exports.advancedSearch = async (req, res, next) => {
  try {
    const filters = {
      keyword: req.query.keyword,
      statut: req.query.statut ? req.query.statut.split(',') : [],
      departement_id: req.query.departement_id,
      processus: req.query.processus,
      norme: req.query.norme,
      redacteur_id: req.query.redacteur_id,
      dateDebut: req.query.dateDebut,
      dateFin: req.query.dateFin,
      limit: req.query.limit
    };
    const results = await SearchService.advancedSearch(filters);
    res.json(results);
  } catch (err) {
    next(err);
  }
};

exports.searchAttachments = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ message: 'keyword requis' });
    }
    const results = await SearchService.searchInAttachments(keyword);
    res.json(results);
  } catch (err) {
    next(err);
  }
};
