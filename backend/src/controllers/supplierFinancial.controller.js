const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const supplierFinancialService = require('../services/supplierFinancial.service');
const logger = require('../utils/logger');

/**
 * Supplier Financial Controller
 * Handles HTTP requests for supplier financial reports
 */

/**
 * Get financial report
 */
const getFinancialReport = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    report_type: req.query.report_type || 'summary',
    group_by: req.query.group_by || 'month'
  };
  
  logger.info(`Generating financial report for supplier ${supplierId} with filters:`, filters);
  const report = await supplierFinancialService.getFinancialReport(supplierId, filters);
  res.json(new ApiResponse(200, 'Financial report generated successfully', report));
});

/**
 * Get tax report
 */
const getTaxReport = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    year: parseInt(req.query.year) || new Date().getFullYear(),
    country: req.query.country
  };
  
  logger.info(`Generating tax report for supplier ${supplierId} for year ${filters.year}`);
  const report = await supplierFinancialService.getTaxReport(supplierId, filters);
  res.json(new ApiResponse(200, 'Tax report generated successfully', report));
});

/**
 * Get financial summary
 */
const getFinancialSummary = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const period = req.query.period || '30d';
  
  logger.info(`Fetching financial summary for supplier ${supplierId} for period ${period}`);
  const summary = await supplierFinancialService.getFinancialSummary(supplierId, period);
  res.json(new ApiResponse(200, 'Financial summary retrieved successfully', summary));
});

/**
 * Get commission breakdown
 */
const getCommissionBreakdown = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    date_from: req.query.date_from,
    date_to: req.query.date_to
  };
  
  logger.info(`Fetching commission breakdown for supplier ${supplierId} with filters:`, filters);
  const breakdown = await supplierFinancialService.getCommissionBreakdown(supplierId, filters);
  res.json(new ApiResponse(200, 'Commission breakdown retrieved successfully', breakdown));
});

module.exports = {
  getFinancialReport,
  getTaxReport,
  getFinancialSummary,
  getCommissionBreakdown
};
