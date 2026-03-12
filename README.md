# AI SaaS Platform - Multi-Tenant White-Label Solution

**Complete SaaS platform for agencies** - Launch your own AI service in minutes with full white-label customization.

![Pricing](https://img.shields.io/badge/pricing-%24199--%24999%2Fmonth-purple)
![ARR Target](https://img.shields.io/badge/ARR%20target-%243M-green)
![Tenants](https://img.shields.io/badge/target-500%20tenants-blue)

## 🎯 Business Model

### Revenue Goals
- **Target:** 500 customers × $500/month average
- **MRR:** $250,000/month
- **ARR:** $3,000,000/year
- **Exit Strategy:** 3-4x ARR = $9-12M valuation

### Pricing Tiers
| Plan | Price | Users | API Calls | Storage |
|------|-------|-------|-----------|---------|
| **Basic** | $199/mo | 5 | 10K/mo | 1GB |
| **Professional** | $499/mo | 25 | 100K/mo | 10GB |
| **Enterprise** | $999/mo | 100 | 1M/mo | 100GB |

## ✨ Features

### Multi-Tenant Architecture
- ✅ Complete data isolation per tenant
- ✅ Tenant-specific configuration
- ✅ Isolated API keys and usage tracking
- ✅ Custom subdomains (tenant.platform.com)

### White-Label Branding
- ✅ Custom logos and colors
- ✅ Custom domains (app.youragency.com)
- ✅ Branded emails and notifications
- ✅ No platform branding visible to end users

### Agency Features
- ✅ User management with roles (owner, admin, user)
- ✅ API access with key management
- ✅ Real-time analytics dashboard
- ✅ Usage tracking and limits
- ✅ Audit logs for compliance

### Enterprise Security
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ GDPR-ready data isolation

### Integrations Ready
- ✅ Stripe billing (subscription management)
- ✅ OpenClaw AI integration
- ✅ Email (SendGrid/Mailgun)
- ✅ CRM webhooks (HubSpot, Salesforce)
- ✅ REST API for custom integrations

## 🚀 Quick Start

### Installation

```bash
# Navigate to project
cd ai-saas-platform

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Initialize database
npm run init-db

# Start server
npm start
```

### Access

- **Landing Page:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **API:** http://localhost:3000/api

### Demo Credentials

```
Tenant Slug: demo-agency
Email: admin@demoagency.com
Password: password123
```

## 📁 Project Structure

```
ai-saas-platform/
├── server.js              # Main Express server
├── public/
│   ├── index.html         # Landing page with pricing
│   ├── dashboard.html     # Tenant dashboard
│   └── white-label.html   # White-label tenant view
├── scripts/
│   ├── init-db.js         # Database initialization
│   └── seed-data.js       # Sample data generator
├── data/
│   └── db.json            # Multi-tenant database
├── .env.example           # Environment template
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔌 API Endpoints

### Public Routes

```http
POST   /api/tenants/register       # Create new tenant
POST   /api/tenants/login          # Tenant login
GET    /api/tenants/:slug/public   # Get tenant public info
GET    /api/health                 # Health check
```

### Protected Routes (Require JWT)

```http
GET    /api/tenant                 # Get current tenant info
PUT    /api/tenant/branding        # Update white-label branding
GET    /api/users                  # List users (admin only)
POST   /api/users                  # Create user (admin only)
GET    /api/keys                   # List API keys (admin only)
POST   /api/keys                   # Create API key (admin only)
POST   /api/chat                   # AI chat endpoint
GET    /api/analytics              # Get usage analytics
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production
BASE_URL=https://yourplatform.com

# Database
DATABASE_PATH=./data/db.json

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenClaw AI
OPENCLAW_API_URL=http://localhost:8080
OPENCLAW_API_KEY=your-key

# Stripe Billing
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
```

## 💰 Monetization

### Revenue Streams

1. **Subscription Fees** ($199-$999/month)
   - Primary revenue source
   - Recurring, predictable income

2. **Usage Overage** (Pay-as-you-go)
   - Additional API calls beyond limits
   - $0.01 per 100 API calls

3. **Premium Add-ons**
   - Custom AI model training: $299/month
   - Dedicated support: $499/month
   - Advanced analytics: $199/month
   - Priority SLA: $399/month

4. **Enterprise Contracts**
   - Annual prepay (2 months free)
   - Custom limits and features
   - White-glove onboarding

### Customer Acquisition

1. **Target Audience:**
   - Digital marketing agencies
   - Web development shops
   - SaaS consultants
   - Business process automation firms

2. **Channels:**
   - Content marketing (SEO, blog)
   - Paid ads (Google, LinkedIn)
   - Agency partnerships
   - Referral program

3. **Conversion Funnel:**
   - Free trial (14 days, no credit card)
   - Demo call with sales team
   - Custom onboarding
   - Success manager assignment

## 📊 Analytics & Metrics

### Key Metrics to Track

- **MRR (Monthly Recurring Revenue)**
- **ARR (Annual Recurring Revenue)**
- **Churn Rate** (target: <5% monthly)
- **LTV (Lifetime Value)**
- **CAC (Customer Acquisition Cost)**
- **API Usage per Tenant**
- **Active Users per Tenant**

### Dashboard Metrics

Each tenant sees:
- API calls this month vs. limit
- Active users count
- Storage usage
- Recent activity logs
- Billing history

## 🔐 Security

### Data Isolation

- Each tenant has unique `tenantId`
- All queries filtered by `tenantId`
- No cross-tenant data access
- Separate API keys per tenant

### Authentication

- JWT tokens with 7-day expiry
- Password hashing with bcrypt (10 rounds)
- Rate limiting on auth endpoints
- Account lockout after failed attempts

### Compliance

- GDPR-ready (data export/deletion)
- Audit logs for all actions
- Encrypted data at rest
- HTTPS enforcement

## 🚀 Scaling Strategy

### Phase 1: 0-50 Tenants ($10-25K MRR)
- Single server deployment
- SQLite database
- Manual onboarding
- Founder-led sales

### Phase 2: 50-200 Tenants ($25-100K MRR)
- Load balancer + 2-3 servers
- PostgreSQL database
- Automated onboarding
- Hire sales team

### Phase 3: 200-500 Tenants ($100-250K MRR)
- Kubernetes cluster
- Database replication
- Multi-region deployment
- Customer success team

### Phase 4: 500+ Tenants ($250K+ MRR)
- Microservices architecture
- Separate services: auth, billing, AI, analytics
- Enterprise infrastructure
- Prepare for acquisition

## 🎯 Exit Strategy

### Acquisition Targets

1. **Strategic Buyers:**
   - CRM platforms (Salesforce, HubSpot)
   - Marketing automation (Marketo, Pardot)
   - Customer support (Zendesk, Intercom)
   - Cloud providers (AWS, Google, Microsoft)

2. **Financial Buyers:**
   - Private equity firms
   - SaaS-focused investors
   - Roll-up acquirers

### Valuation Drivers

- **ARR Growth Rate** (target: 20%+ MoM)
- **Churn Rate** (target: <5%)
- **Gross Margin** (target: 80%+)
- **Customer Concentration** (no single customer >10%)
- **Technology Moat** (proprietary AI, integrations)

### Timeline

- **Year 1:** Build product, get 50 customers ($300K ARR)
- **Year 2:** Scale to 200 customers ($1.2M ARR)
- **Year 3:** Reach 500 customers ($3M ARR)
- **Year 4:** Exit at 3-4x ARR ($9-12M)

## 📝 License

MIT License - Build your SaaS business!

## 🙏 Credits

Built with:
- [OpenClaw](https://openclaw.ai) - AI orchestration
- [Express.js](https://expressjs.com) - Web framework
- [lowdb](https://github.com/typicode/lowdb) - Database
- [Stripe](https://stripe.com) - Billing
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

**Ready to launch your AI SaaS?** Start with `npm install` and deploy! 🚀

For questions: tigha66 on GitHub
