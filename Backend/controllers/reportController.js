const ReportService = require('../services/reportService');

exports.getApprovalRate = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await ReportService.getApprovalRate(startDate, endDate);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getApprovalTimeStats = async (req, res, next) => {
  try {
    const stats = await ReportService.getApprovalTimeStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getRejectionByUser = async (req, res, next) => {
  try {
    const stats = await ReportService.getRejectionByUser();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getProceduresByDepartment = async (req, res, next) => {
  try {
    const stats = await ReportService.getProceduresByDepartment();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getProceduresByNorme = async (req, res, next) => {
  try {
    const stats = await ReportService.getProceduresByNorme();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getObsoleteProcedures = async (req, res, next) => {
  try {
    const months = req.query.months || 12;
    const procedures = await ReportService.getObsoleteProcedures(months);
    res.json(procedures);
  } catch (err) {
    next(err);
  }
};

exports.getWorkflowPerformance = async (req, res, next) => {
  try {
    const stats = await ReportService.getWorkflowPerformance();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
