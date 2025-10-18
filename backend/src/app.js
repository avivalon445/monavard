const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const categoryRoutes = require('./routes/category.routes');
const requestRoutes = require('./routes/request.routes');
const supplierRequestRoutes = require('./routes/supplierRequest.routes');
const bidRoutes = require('./routes/bid.routes');
const supplierBidRoutes = require('./routes/supplierBid.routes');
const orderRoutes = require('./routes/order.routes');
const supplierOrderRoutes = require('./routes/supplierOrder.routes');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/message.routes');
const reviewRoutes = require('./routes/review.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const uploadRoutes = require('./routes/upload.routes');
const categorizationRoutes = require('./routes/categorization.routes');

// Supplier-specific routes
const supplierProfileRoutes = require('./routes/supplierProfile.routes');
const supplierPortfolioRoutes = require('./routes/supplierPortfolio.routes');
const supplierFinancialRoutes = require('./routes/supplierFinancial.routes');
const supplierSettingsRoutes = require('./routes/supplierSettings.routes');

// Initialize express app
const app = express();

// Trust proxy (if behind nginx/load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';
const apiRouter = express.Router();

// Health check route
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Apply rate limiting to API routes
apiRouter.use(rateLimiter);

// Mount routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/requests', requestRoutes);
apiRouter.use('/supplier/requests', supplierRequestRoutes);
apiRouter.use('/bids', bidRoutes);
apiRouter.use('/supplier/bids', supplierBidRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/supplier/orders', supplierOrderRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/messages', messageRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/categorization', categorizationRoutes);

// Supplier-specific routes
apiRouter.use('/supplier/profile', supplierProfileRoutes);
apiRouter.use('/supplier/portfolio', supplierPortfolioRoutes);
apiRouter.use('/supplier/financial', supplierFinancialRoutes);
apiRouter.use('/supplier/settings', supplierSettingsRoutes);

// Mount API router
app.use(`/api/${API_VERSION}`, apiRouter);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CustomBid API Server',
    version: API_VERSION,
    documentation: `/api/${API_VERSION}/docs`,
    health: `/api/${API_VERSION}/health`
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;

