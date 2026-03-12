# 🔑 DashScope (Qwen) API Setup Guide

Your AI SaaS Platform is now configured to use **Alibaba Cloud DashScope (Qwen)** for AI!

---

## 📋 Configuration

**Base URL:** `https://dashscope.aliyuncs.com/compatible-mode/v1`  
**API Key:** Get yours from Alibaba Cloud  
**Model:** Qwen-Plus

---

## 🚀 Get Your API Key

### Step 1: Create Alibaba Cloud Account

1. Go to: https://www.alibabacloud.com/
2. Click "Sign Up"
3. Complete registration (email, phone verification)

### Step 2: Activate DashScope

1. Go to: https://dashscope.console.aliyun.com/
2. Click "Activate Now" or "开通服务"
3. Complete real-name verification (required)

### Step 3: Create API Key

1. Go to: https://ram.console.aliyun.com/manage/ak
2. Click "Create AccessKey"
3. **Important:** Download and save your:
   - **AccessKey ID**
   - **AccessKey Secret**

### Step 4: Get DashScope API Key

1. Go to: https://dashscope.console.aliyun.com/apiKey
2. Your API key will be displayed (starts with `sk-`)
3. **Copy it immediately** - you can't see it again!

---

## ⚙️ Configure Your App

### Edit `.env` File

Open: `/home/admin/.openclaw/workspace/ai-saas-platform/.env`

```env
# DashScope AI Integration (Qwen)
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_API_KEY=sk-your-actual-api-key-here
AI_PROVIDER=dashscope
```

**Replace** `sk-your-actual-api-key-here` with your real key!

### Restart Server

```bash
cd /home/admin/.openclaw/workspace/ai-saas-platform

# Stop current server (Ctrl+C)

# Start again
npm start
```

---

## ✅ Test Your AI

### Option 1: Test from Dashboard

1. Go to: http://localhost:3000/dashboard
2. Login with demo account:
   - Slug: `demo-agency`
   - Email: `admin@demoagency.com`
   - Password: `password123`
3. Click "Test API Connection"
4. You should get a response from Qwen!

### Option 2: Test with curl

```bash
# First, get a token by logging in
curl -X POST http://localhost:3000/api/tenants/login \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "demo-agency",
    "email": "admin@demoagency.com",
    "password": "password123"
  }'

# Copy the token from response, then test chat:
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Qwen!"}'
```

---

## 💰 Pricing (DashScope)

**Qwen-Plus Pricing:**
- Input: ¥0.004 / 1K tokens (~$0.0006)
- Output: ¥0.012 / 1K tokens (~$0.0017)

**Example Costs:**
- 100K API calls/month ≈ $50-100
- Well within your $499/month Professional plan margin!

---

## 🔧 Available Models

You can change the model in `server.js`:

```javascript
// In callAI() function, change:
model: 'qwen-plus',  // Current

// To other models:
model: 'qwen-turbo',     // Faster, cheaper
model: 'qwen-max',       // Most powerful
model: 'qwen-long',      // Long context (256K tokens)
```

---

## ⚠️ Troubleshooting

### Error: "Invalid API Key"
- Double-check your key in `.env`
- Make sure there are no spaces
- Restart the server after changing `.env`

### Error: "Insufficient Balance"
- Add credit to your DashScope account
- Check: https://usercenter2.aliyun.com/finance/overview

### Error: "Service Not Activated"
- Go to DashScope console and activate the service
- Complete real-name verification

### No Response from AI
- Check server logs: `npm start` shows errors
- Verify API key is correct
- Test with curl (see above)

---

## 📊 Monitor Usage

Check your DashScope usage:
- Console: https://dashscope.console.aliyun.com/usage
- Set budget alerts to avoid surprises

---

## 🎯 Your AI SaaS is Ready!

With DashScope configured:

✅ **AI Chat** - Working with Qwen  
✅ **Multi-Tenant** - Each tenant gets isolated AI  
✅ **Usage Tracking** - Track API calls per tenant  
✅ **White-Label** - Your branding, your AI  
✅ **Profit Margin** - Charge $499, pay ~$50-100 for AI  

**Start signing customers!** 🚀

---

**Need help?** Check the logs or test with the dashboard.

**Dashboard:** http://localhost:3000/dashboard
