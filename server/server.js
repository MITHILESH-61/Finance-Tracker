import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Load environment variables FIRST, before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Fix for Node's DNS resolver failing on SRV lookups (common Windows issue)
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Debug: Check if MONGODB_URI is loaded
console.log('Environment variables loaded');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

import app, { connectDB } from './app.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();