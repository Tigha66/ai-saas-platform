/**
 * Database Initialization Script
 * Sets up multi-tenant structure with sample data
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory:', dataDir);
}

const adapter = new FileSync(dbPath);
const db = low(adapter);

console.log('🗄️  Initializing multi-tenant database...');

// Initialize with sample tenants
const sampleData = {
  tenants: [
    {
      id: 'demo001',
      name: 'Demo Agency',
      slug: 'demo-agency',
      email: 'admin@demoagency.com',
      company: 'Demo Agency Inc.',
      plan: 'professional',
      status: 'active',
      branding: {
        logo: null,
        colors: {
          primary: '#667eea',
          secondary: '#764ba2'
        },
        customDomain: null
      },
      settings: {
        timezone: 'America/New_York',
        language: 'en',
        features: {
          aiChat: true,
          analytics: true,
          apiAccess: true,
          customBranding: false,
          prioritySupport: false
        }
      },
      limits: {
        users: 25,
        apiCallsPerMonth: 100000,
        storageGB: 10
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  
  users: [
    {
      id: 'user001',
      tenantId: 'demo001',
      email: 'admin@demoagency.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Admin User',
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user002',
      tenantId: 'demo001',
      email: 'user@demoagency.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Regular User',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ],
  
  subscriptions: [],
  apiKeys: [
    {
      id: 'key001',
      tenantId: 'demo001',
      key: 'sk_demo1234567890abcdefghijklmnopqrstuvwxyz',
      name: 'Default API Key',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ],
  
  usage: [
    {
      tenantId: 'demo001',
      date: new Date().toISOString().split('T')[0],
      apiCalls: 1234
    }
  ],
  
  customDomains: [],
  auditLogs: []
};

// Write sample data
db.setState(sampleData).write();

console.log('✅ Database initialized successfully!');
console.log('📊 Sample data:');
console.log('   - 1 tenant (Demo Agency - Professional plan)');
console.log('   - 2 users (1 owner, 1 user)');
console.log('   - 1 API key');
console.log('   - Usage tracking enabled');
console.log('\n📁 Database location:', dbPath);
console.log('\n🔐 Demo credentials:');
console.log('   Email: admin@demoagency.com');
console.log('   Password: password123');
console.log('\n🚀 Start server with: npm start');
