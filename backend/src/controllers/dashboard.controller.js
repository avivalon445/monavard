const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get customer dashboard data
 * GET /api/v1/dashboard/customer
 */
const getCustomerDashboard = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  
  const dashboardData = await dashboardService.getCustomerDashboard(customerId);
  
  res.json(
    new ApiResponse(200, 'Dashboard data retrieved successfully', dashboardData)
  );
});

/**
 * Get supplier dashboard data
 * GET /api/v1/dashboard/supplier
 */
const getSupplierDashboard = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  const dashboardData = await dashboardService.getSupplierDashboard(supplierId);
  
  res.json(
    new ApiResponse(200, 'Dashboard data retrieved successfully', dashboardData)
  );
});

module.exports = {
  getCustomerDashboard,
  getSupplierDashboard,
};

