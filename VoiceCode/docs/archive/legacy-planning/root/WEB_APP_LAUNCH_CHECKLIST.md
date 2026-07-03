# VoiceCode Web App - 3-Week Launch Checklist

**Target Launch Date**: Week of January 20, 2026  
**Launch Type**: Beta/Soft Launch (Payment Disabled)  
**Full Launch**: Week of January 27, 2026 (with payment)

---

## Week 1: Critical Blockers (Jan 6-10)

### Day 1: PWA Icons & Environment Setup

- [ ] **Generate PWA Icons** (2 hours) 🔴 BLOCKER
  ```bash
  # Install PWA Asset Generator
  npm install -g pwa-asset-generator
  
  # Generate icons (requires logo.svg in public/)
  cd VoiceCode/apps/web
  npx pwa-asset-generator public/logo.svg public/icons \
    --icon-only --favicon --type png --padding "10%"
  
  # Verify 8 icon sizes generated:
  # 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
  ```
  - [ ] Create `public/logo.svg` if missing
  - [ ] Generate all 8 icon sizes
  - [ ] Update `manifest.json` icon paths
  - [ ] Test PWA installation on Chrome (desktop + mobile)

- [ ] **Create `.env.example`** (1 hour)
  ```bash
  # Required environment variables
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_AIML_API_KEY=your-aiml-api-key
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
  VITE_ENCRYPTION_KEY=your-32-char-encryption-key
  VITE_ENABLE_E2E_AUTH_BYPASS=false
  ```
  - [ ] Document all required variables
  - [ ] Add comments explaining each variable
  - [ ] Create `.env.development.example`
  - [ ] Create `.env.production.example`

- [ ] **Create Offline Page** (2 hours)
  - [ ] Create `public/offline.html` with branding
  - [ ] Add offline message and retry button
  - [ ] Update `sw.js` to serve offline page
  - [ ] Test offline functionality

### Day 2-4: Payment Integration (2-3 days) 🔴 REVENUE BLOCKER

- [ ] **Deploy Supabase Edge Functions**
  ```bash
  # Install Supabase CLI
  npm install -g supabase
  
  # Login to Supabase
  supabase login
  
  # Link to project
  supabase link --project-ref <your-project-ref>
  
  # Deploy functions
  supabase functions deploy create-checkout-session
  supabase functions deploy create-payment-intent
  supabase functions deploy stripe-webhook
  ```
  - [ ] Create `supabase/functions/create-checkout-session/index.ts`
  - [ ] Create `supabase/functions/create-payment-intent/index.ts`
  - [ ] Create `supabase/functions/stripe-webhook/index.ts`
  - [ ] Set Stripe secret key in Supabase secrets
  - [ ] Deploy all 3 functions
  - [ ] Test function endpoints with curl

- [ ] **Configure Stripe Webhooks**
  - [ ] Add webhook endpoint in Stripe Dashboard
  - [ ] Configure events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - [ ] Copy webhook signing secret to Supabase
  - [ ] Test webhook delivery

- [ ] **Test Payment Flow End-to-End**
  - [ ] Test Pro Monthly subscription
  - [ ] Test Pro Yearly subscription
  - [ ] Test Enterprise Monthly subscription
  - [ ] Test Enterprise Yearly subscription
  - [ ] Test subscription cancellation
  - [ ] Test subscription renewal
  - [ ] Verify webhook events received

### Day 5: Verification & Testing

- [ ] **Build & Deploy to Staging**
  ```bash
  cd VoiceCode/apps/web
  npm run build:staging
  vercel --prod
  ```
  - [ ] Verify build succeeds
  - [ ] Deploy to Vercel staging
  - [ ] Test staging deployment
  - [ ] Verify environment variables set

- [ ] **Week 1 Checklist**
  - [ ] PWA icons generated and working
  - [ ] Environment variables documented
  - [ ] Offline page created
  - [ ] Payment integration deployed
  - [ ] Payment flow tested end-to-end
  - [ ] Staging deployment successful

---

## Week 2: Quality & Monitoring (Jan 13-17)

### Day 1: Error Tracking (4 hours)

- [ ] **Integrate Sentry**
  ```bash
  cd VoiceCode/apps/web
  npm install @sentry/react @sentry/vite-plugin
  ```
  - [ ] Create Sentry account (free tier)
  - [ ] Create new project for VoiceCode Web
  - [ ] Add Sentry initialization to `main.tsx`
  - [ ] Configure error boundaries
  - [ ] Add source map upload to build
  - [ ] Test error reporting
  - [ ] Set up alerts for critical errors

### Day 2: Accessibility Audit (1 day)

- [ ] **Run Automated Audit**
  ```bash
  # Install axe DevTools extension
  # Or use axe-core CLI
  npm install -g @axe-core/cli
  axe http://localhost:4173 --save audit-results.json
  ```
  - [ ] Run axe audit on all pages
  - [ ] Run Lighthouse accessibility audit
  - [ ] Document all issues (critical, serious, moderate, minor)
  - [ ] Prioritize fixes

### Day 3: Fix Critical Accessibility Issues (1 day)

- [ ] **Fix Critical Issues**
  - [ ] Add missing ARIA labels
  - [ ] Fix heading hierarchy
  - [ ] Ensure keyboard navigation works
  - [ ] Fix color contrast issues
  - [ ] Add alt text to images
  - [ ] Fix form error announcements
  - [ ] Test with screen reader (NVDA or VoiceOver)

### Day 4-5: Write Critical Path Tests (2 days)

- [ ] **Authentication Tests**
  ```bash
  cd VoiceCode/apps/web
  npm run test
  ```
  - [ ] Test email/password signup
  - [ ] Test email/password login
  - [ ] Test OAuth login (Google, GitHub, Microsoft)
  - [ ] Test logout
  - [ ] Test session persistence
  - [ ] Test protected routes

- [ ] **Recording Flow Tests**
  - [ ] Test start recording
  - [ ] Test stop recording
  - [ ] Test auto-transcription
  - [ ] Test save transcript
  - [ ] Test edit transcript
  - [ ] Test export transcript

- [ ] **Week 2 Checklist**
  - [ ] Sentry integrated and tested
  - [ ] Accessibility audit completed
  - [ ] Critical accessibility issues fixed
  - [ ] Auth tests written and passing
  - [ ] Recording tests written and passing
  - [ ] Test coverage improved to 60%+

---

## Week 3: Polish & Launch (Jan 20-24)

### Day 1: SEO & Security (4-6 hours)

- [ ] **Add SEO Meta Tags** (4 hours)
  - [ ] Update `index.html` with Open Graph tags
  - [ ] Add Twitter Card tags
  - [ ] Add canonical URL
  - [ ] Add structured data (JSON-LD)
  - [ ] Generate `sitemap.xml`
  - [ ] Create `robots.txt`
  - [ ] Test with Facebook Debugger
  - [ ] Test with Twitter Card Validator

- [ ] **Add Security Headers** (2 hours)
  - [ ] Add Content-Security-Policy to `vercel.json`
  - [ ] Add Permissions-Policy
  - [ ] Add Strict-Transport-Security (HSTS)
  - [ ] Test with securityheaders.com

### Day 2: Browser Compatibility Testing (1 day)

- [ ] **Test on All Browsers**
  - [ ] Chrome 90+ (Windows, macOS, Linux)
  - [ ] Firefox 88+ (Windows, macOS, Linux)
  - [ ] Safari 14+ (macOS)
  - [ ] Safari (iOS 14+)
  - [ ] Edge 90+ (Windows)
  - [ ] Document any browser-specific issues
  - [ ] Fix critical browser bugs

### Day 3: Performance Testing (1 day)

- [ ] **Run Performance Audits**
  ```bash
  # Lighthouse CI
  npm install -g @lhci/cli
  lhci autorun --collect.url=http://localhost:4173
  ```
  - [ ] Run Lighthouse audit (target: 90+ score)
  - [ ] Run WebPageTest (target: A grade)
  - [ ] Measure Core Web Vitals
  - [ ] Optimize images if needed
  - [ ] Optimize fonts if needed
  - [ ] Test on slow 3G network

### Day 4: Pre-Launch Checklist

- [ ] **Final Verification**
  - [ ] All Week 1 tasks complete
  - [ ] All Week 2 tasks complete
  - [ ] All Week 3 tasks complete
  - [ ] Production environment variables set
  - [ ] Sentry configured for production
  - [ ] Payment integration working (or disabled for beta)
  - [ ] PWA installation working
  - [ ] Offline mode working
  - [ ] All critical tests passing
  - [ ] Accessibility audit passed
  - [ ] Browser compatibility verified
  - [ ] Performance targets met

### Day 5: Soft Launch 🎉

- [ ] **Deploy to Production**
  ```bash
  cd VoiceCode/apps/web
  npm run build:production
  vercel --prod
  ```
  - [ ] Deploy to production
  - [ ] Verify deployment successful
  - [ ] Test production site
  - [ ] Monitor Sentry for errors

- [ ] **Beta User Recruitment**
  - [ ] Send invites to beta users (50-100 users)
  - [ ] Create feedback form
  - [ ] Set up support email
  - [ ] Monitor user feedback
  - [ ] Monitor Sentry errors
  - [ ] Monitor performance metrics

---

## Post-Launch: Week 4 (Jan 27-31)

### Enable Payment (if disabled for beta)

- [ ] **Enable Stripe Integration**
  - [ ] Verify all payment tests passing
  - [ ] Switch to Stripe live mode
  - [ ] Update environment variables
  - [ ] Test live payment flow
  - [ ] Enable Pro/Enterprise tiers
  - [ ] Announce pricing to beta users

### Monitor & Iterate

- [ ] **Daily Monitoring**
  - [ ] Check Sentry for errors
  - [ ] Review user feedback
  - [ ] Monitor performance metrics
  - [ ] Monitor conversion rates
  - [ ] Fix critical bugs within 24 hours

---

## Success Criteria

**Beta Launch (Week 3)**:
- ✅ PWA installation works
- ✅ Core features functional (recording, transcription, export)
- ✅ Authentication works (email + OAuth)
- ✅ Offline mode works
- ✅ No critical bugs
- ✅ Accessibility audit passed
- ✅ Performance score 85+
- ✅ 50+ beta users onboarded

**Full Launch (Week 4)**:
- ✅ Payment integration works
- ✅ Subscriptions can be purchased
- ✅ Webhooks processing correctly
- ✅ First paying customer 🎉

---

**Last Updated**: January 3, 2026  
**Owner**: VoiceCode Development Team  
**Status**: Ready to Execute

