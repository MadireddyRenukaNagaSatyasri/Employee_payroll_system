import app from './app.js';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import { seedSampleData } from './utils/seedData.js';

const PORT = process.env.PORT || 5000;

// Connect to Database first, then start server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed admin and sample data if database is currently empty
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        console.log('🔄 Fresh database detected. Auto-seeding initial admin and sample data...');
        await seedSampleData({ shouldExit: false, shouldDisconnect: false });
      }
    } catch (seedErr) {
      console.warn(`⚠️ Auto-seed notice: ${seedErr.message}`);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 Application URL: http://0.0.0.0:${PORT}`);
      console.log(`🔑 Admin Login: admin@payroll.com / Admin@12345`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(`Uncaught Exception Error: ${err.message}`);
      process.exit(1);
    });

    // Graceful shutdown on SIGTERM / SIGINT
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
