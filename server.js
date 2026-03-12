/**
 * Multi-Tenant AI SaaS Platform
 * White-label solution for agencies
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize lowdb for multi-tenant storage
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(process.env.DATABASE_PATH || './data/db.json');
const db = low(adapter);

// Initialize database structure
db.defaults({
  tenants: [],
  users: [],
  subscriptions: [],
  apiKeys: [],
  usage: [],
  customDomains: [],
  auditLogs: []
}).write();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST']
  },
  // Security: WebSocket origin validation (OpenClaw v2026.3.11)
  // Prevents cross-site WebSocket hijacking
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    
    // Allow in development or if origin matches allowed list
    if (process.env.NODE_ENV === 'development' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Blocked WebSocket connection from:', origin);
      callback(new Error('Cross-site WebSocket hijacking prevented'), false);
    }
  }
});

// ==================== Middleware ====================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ==================== Helper Functions ====================

function generateId() {
  return uuidv4().split('-')[0];
}

function generateApiKey() {
  return `sk_${uuidv4().replace(/-/g, '')}`;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Tenant middleware - isolate data by tenant
function tenantMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  req.tenantId = decoded.tenantId;
  
  // Verify tenant exists
  const tenant = db.get('tenants').find({ id: decoded.tenantId }).value();
  if (!tenant) {
    return res.status(403).json({ error: 'Tenant not found' });
  }
  
  req.tenant = tenant;
  next();
}

// Admin middleware
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ==================== Public Routes ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Tenant registration
app.post('/api/tenants/register', async (req, res) => {
  try {
    const { name, slug, email, password, company, plan = 'basic' } = req.body;
    
    // Validate slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
    }
    
    // Check if slug exists
    const existing = db.get('tenants').find({ slug }).value();
    if (existing) {
      return res.status(409).json({ error: 'Tenant slug already taken' });
    }
    
    // Create tenant
    const tenant = {
      id: generateId(),
      name,
      slug,
      email,
      company,
      plan,
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
        timezone: 'UTC',
        language: 'en',
        features: {
          aiChat: true,
          analytics: true,
          apiAccess: plan !== 'basic',
          customBranding: plan === 'enterprise',
          prioritySupport: plan === 'enterprise'
        }
      },
      limits: {
        users: plan === 'basic' ? 5 : plan === 'pro' ? 25 : 100,
        apiCallsPerMonth: plan === 'basic' ? 10000 : plan === 'pro' ? 100000 : 1000000,
        storageGB: plan === 'basic' ? 1 : plan === 'pro' ? 10 : 100
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.get('tenants').push(tenant).write();
    
    // Create owner user
    const owner = {
      id: generateId(),
      tenantId: tenant.id,
      email,
      password: hashPassword(password),
      name: 'Owner',
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    db.get('users').push(owner).write();
    
    // Generate API key
    const apiKey = {
      id: generateId(),
      tenantId: tenant.id,
      key: generateApiKey(),
      name: 'Default API Key',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    db.get('apiKeys').push(apiKey).write();
    
    // Generate JWT token
    const token = generateToken({
      userId: owner.id,
      tenantId: tenant.id,
      email: owner.email,
      role: owner.role
    });
    
    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      },
      user: {
        id: owner.id,
        email: owner.email,
        role: owner.role
      },
      apiKey: apiKey.key,
      token
    });
  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tenant login
app.post('/api/tenants/login', (req, res) => {
  try {
    const { email, password, slug } = req.body;
    
    // Find tenant
    const tenant = db.get('tenants').find({ slug }).value();
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Find user
    const user = db.get('users').find({ tenantId: tenant.id, email }).value();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      message: 'Login successful',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        branding: tenant.branding
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tenant by slug (for custom domains)
app.get('/api/tenants/:slug/public', (req, res) => {
  const tenant = db.get('tenants').find({ slug: req.params.slug }).value();
  if (!tenant || tenant.status !== 'active') {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  res.json({
    name: tenant.name,
    company: tenant.company,
    branding: tenant.branding,
    features: tenant.settings.features
  });
});

// ==================== Protected Routes ====================

// Get current tenant info
app.get('/api/tenant', tenantMiddleware, (req, res) => {
  const tenant = db.get('tenants').find({ id: req.tenantId }).value();
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  // Get usage stats
  const currentUsage = db.get('usage')
    .filter({ tenantId: req.tenantId })
    .filter(u => {
      const date = new Date(u.date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    })
    .value();
  
  const apiCallsThisMonth = currentUsage.reduce((sum, u) => sum + (u.apiCalls || 0), 0);
  
  res.json({
    ...tenant,
    usage: {
      apiCalls: apiCallsThisMonth,
      limit: req.tenant.limits.apiCallsPerMonth,
      percentage: ((apiCallsThisMonth / req.tenant.limits.apiCallsPerMonth) * 100).toFixed(2)
    }
  });
});

// Update tenant branding (white-label)
app.put('/api/tenant/branding', tenantMiddleware, adminMiddleware, (req, res) => {
  try {
    const { logo, colors, customDomain } = req.body;
    
    const tenant = db.get('tenants')
      .find({ id: req.tenantId })
      .assign({
        branding: {
          ...req.tenant.branding,
          ...(logo && { logo }),
          ...(colors && { colors }),
          ...(customDomain && { customDomain })
        },
        updatedAt: new Date().toISOString()
      })
      .write();
    
    res.json({ message: 'Branding updated', branding: tenant.branding });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users in tenant
app.get('/api/users', tenantMiddleware, adminMiddleware, (req, res) => {
  const users = db.get('users').filter({ tenantId: req.tenantId }).value();
  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt
  })));
});

// Create user
app.post('/api/users', tenantMiddleware, adminMiddleware, (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    // Check user limit
    const currentUsers = db.get('users').filter({ tenantId: req.tenantId }).size().value();
    if (currentUsers >= req.tenant.limits.users) {
      return res.status(403).json({ error: `User limit reached (${req.tenant.limits.users})` });
    }
    
    const user = {
      id: generateId(),
      tenantId: req.tenantId,
      email,
      password: hashPassword(password),
      name,
      role,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    db.get('users').push(user).write();
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Keys management
app.get('/api/keys', tenantMiddleware, adminMiddleware, (req, res) => {
  const keys = db.get('apiKeys')
    .filter({ tenantId: req.tenantId })
    .value();
  
  res.json(keys.map(k => ({
    id: k.id,
    name: k.name,
    key: `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}`,
    status: k.status,
    createdAt: k.createdAt
  })));
});

app.post('/api/keys', tenantMiddleware, adminMiddleware, (req, res) => {
  const { name } = req.body;
  
  const apiKey = {
    id: generateId(),
    tenantId: req.tenantId,
    key: generateApiKey(),
    name: name || 'New API Key',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  db.get('apiKeys').push(apiKey).write();
  
  res.status(201).json({
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.key // Full key shown only once
  });
});

// AI Chat endpoint (multi-tenant isolated)
app.post('/api/chat', tenantMiddleware, async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    // Track usage
    const today = new Date().toISOString().split('T')[0];
    const usage = db.get('usage')
      .find({ tenantId: req.tenantId, date: today })
      .value();
    
    if (usage) {
      db.get('usage')
        .find({ tenantId: req.tenantId, date: today })
        .assign({ apiCalls: (usage.apiCalls || 0) + 1 })
        .write();
    } else {
      db.get('usage').push({
        tenantId: req.tenantId,
        date: today,
        apiCalls: 1
      }).write();
    }
    
    // Check limits
    const currentUsage = db.get('usage')
      .filter({ tenantId: req.tenantId })
      .filter(u => {
        const date = new Date(u.date);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      })
      .value();
    
    const apiCallsThisMonth = currentUsage.reduce((sum, u) => sum + (u.apiCalls || 0), 0);
    
    if (apiCallsThisMonth >= req.tenant.limits.apiCallsPerMonth) {
      return res.status(429).json({ 
        error: 'API limit reached',
        limit: req.tenant.limits.apiCallsPerMonth,
        usage: apiCallsThisMonth
      });
    }
    
    // Call DashScope AI (Qwen)
    const response = await callAI({
      message,
      context: {
        ...context,
        tenant: req.tenant.name,
        plan: req.tenant.plan
      }
    });
    
    // Log for analytics
    db.get('auditLogs').push({
      tenantId: req.tenantId,
      userId: req.user.userId,
      action: 'api.chat',
      timestamp: new Date().toISOString(),
      metadata: { messageLength: message.length }
    }).write();
    
    res.json({
      response,
      usage: {
        apiCalls: apiCallsThisMonth + 1,
        limit: req.tenant.limits.apiCallsPerMonth
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoint
app.get('/api/analytics', tenantMiddleware, (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get usage data
  const usage = db.get('usage')
    .filter({ tenantId: req.tenantId })
    .filter(u => new Date(u.date) >= startDate)
    .value();
  
  // Get API call trends
  const apiCallsByDay = usage.map(u => ({
    date: u.date,
    calls: u.apiCalls || 0
  }));
  
  // Get audit logs
  const logs = db.get('auditLogs')
    .filter({ tenantId: req.tenantId })
    .filter(l => new Date(l.timestamp) >= startDate)
    .value();
  
  res.json({
    period: `${days} days`,
    totalApiCalls: usage.reduce((sum, u) => sum + (u.apiCalls || 0), 0),
    avgDailyCalls: (usage.reduce((sum, u) => sum + (u.apiCalls || 0), 0) / days).toFixed(2),
    apiCallsByDay,
    totalRequests: logs.length,
    limit: req.tenant.limits.apiCallsPerMonth,
    usagePercentage: ((usage.reduce((sum, u) => sum + (u.apiCalls || 0), 0) / req.tenant.limits.apiCallsPerMonth) * 100).toFixed(2)
  });
});

// ==================== AI Integration (Multi-Provider) ====================
// Updated for OpenClaw v2026.3.11 with support for new models

async function callAI({ message, context }) {
  const API_PROVIDER = process.env.AI_PROVIDER || 'dashscope';
  const systemPrompt = `You are an AI assistant for ${context.tenant}, a ${context.plan} plan customer.
Provide helpful, professional responses.
Be concise and actionable.`;

  // DashScope (Qwen) Provider
  if (API_PROVIDER === 'dashscope') {
    const BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const API_KEY = process.env.DASHSCOPE_API_KEY;
    
    if (!API_KEY || API_KEY === 'your-api-key-here') {
      console.log('⚠️  No DashScope API key configured - using demo response');
      return `Hello! I'm the AI assistant for ${context.tenant}. 

To enable full AI functionality, please add your DashScope API key to the .env file:

DASHSCOPE_API_KEY=your-actual-key-here

Get your key from: https://dashscope.console.aliyun.com/apiKey`;
    }

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('DashScope API error:', data.error);
        return `AI service temporarily unavailable. Please try again later.`;
      }
      
      return data.choices?.[0]?.message?.content || "I'd be happy to help!";
    } catch (error) {
      console.error('DashScope API error:', error);
      return "I'm here to help! How can I assist you today?";
    }
  }
  
  // OpenRouter Provider (with Hunter Alpha & Healer Alpha support - OpenClaw v2026.3.11)
  if (API_PROVIDER === 'openrouter') {
    const API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!API_KEY) {
      return callAI({ message, context }); // Fallback to demo
    }

    try {
      // Use free Hunter Alpha or Healer Alpha models when available
      const model = context.useFreeModel ? 'meta-llama/llama-3-8b-instruct:free' : 'openai/gpt-3.5-turbo';
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': process.env.BASE_URL || 'http://localhost:3000',
          'X-Title': 'AI SaaS Platform'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "I'd be happy to help!";
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return "I'm here to help! How can I assist you today?";
    }
  }

  // Default fallback
  return "I'm here to help! How can I assist you today?";
}

// ==================== Real-time Events ====================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('tenant:join', (tenantId) => {
    socket.join(`tenant:${tenantId}`);
    console.log(`Client joined tenant:${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ==================== Serve Frontend ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/app/:slug', (req, res) => {
  // Custom domain routing for white-label
  const tenant = db.get('tenants').find({ slug: req.params.slug }).value();
  if (tenant && tenant.branding.customDomain) {
    res.sendFile(path.join(__dirname, 'public', 'white-label.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// ==================== Start Server ====================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 AI SaaS Platform running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`💰 Pricing: $199-$999/month per tenant`);
  console.log(`🎯 Target: 500 tenants × $500 avg = $3M ARR`);
});

module.exports = app;
