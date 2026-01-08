# VoiceFlow PRO - Deployment Guide

## Environment Configuration

VoiceFlow PRO supports three deployment environments:

1. **Development** - Local development with hot reload
2. **Staging** - Pre-production testing environment
3. **Production** - Live production environment

---

## Environment Files

### Development (`.env`)
Used for local development with `npm run dev`

### Staging (`.env.staging`)
Used for staging deployments with `npm run build:staging`

### Production (`.env.production`)
Used for production deployments with `npm run build:production`

---

## Build Commands

### Development
```bash
# Start development server
npm run dev

# Start with staging config
npm run dev:staging
```

### Staging Build
```bash
# Build for staging
npm run build:staging

# Preview staging build
npm run preview:staging
```

### Production Build
```bash
# Build for production
npm run build:production

# Preview production build
npm run preview:production
```

---

## Vercel Deployment

### Automatic Deployments

VoiceFlow PRO is configured for automatic Vercel deployments:

- **Production**: Deploys from `master` branch
- **Preview**: Deploys from feature branches
- **Staging**: Configured via environment settings

### Environment Variables (Vercel Dashboard)

Configure these in Vercel Project Settings → Environment Variables:

#### Production Environment
```
VITE_APP_ENV=production
VITE_APP_NAME=VoiceFlow Pro
VITE_AIML_API_KEY=[your_production_key]
VITE_SUPABASE_URL=[your_production_url]
VITE_SUPABASE_ANON_KEY=[your_production_key]
VITE_STRIPE_PUBLISHABLE_KEY=[your_production_key]
VITE_ENABLE_E2E_AUTH_BYPASS=false
```

#### Staging Environment
```
VITE_APP_ENV=staging
VITE_APP_NAME=VoiceFlow Pro (Staging)
VITE_AIML_API_KEY=[your_staging_key]
VITE_SUPABASE_URL=[your_staging_url]
VITE_SUPABASE_ANON_KEY=[your_staging_key]
VITE_STRIPE_PUBLISHABLE_KEY=[your_staging_test_key]
VITE_ENABLE_E2E_AUTH_BYPASS=false
```

### Build Configuration

**vercel.json** is already configured with:
- SPA routing rewrites
- Security headers
- Asset caching
- Build settings

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Link project (first time)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy to staging (with staging env)
vercel --prod --env VITE_APP_ENV=staging
```

---

## GitHub Actions CI/CD

The `.github/workflows/ci.yml` pipeline automatically:

1. **On Push to Any Branch:**
   - Type checks
   - Lints code
   - Runs unit tests
   - Checks bundle size
   - Runs security audit
   - Runs E2E smoke tests

2. **On Push to `master`:**
   - Triggers Vercel production deployment

3. **On Pull Request:**
   - Runs all checks
   - Creates preview deployment

### Manual Deployment Trigger

```bash
# Push to master to trigger production deployment
git push origin master

# Create PR to trigger preview deployment
git checkout -b feature/my-feature
git push origin feature/my-feature
# Open PR on GitHub
```

---

## Pre-Deployment Checklist

### Before Staging Deployment

- [ ] Update `.env.staging` with correct API keys
- [ ] Test OAuth providers (Google, GitHub, Microsoft)
- [ ] Verify Supabase staging project is set up
- [ ] Test Stripe in test mode
- [ ] Run `npm run test:ci` locally
- [ ] Run `npm run test:e2e` locally
- [ ] Check bundle size: `npm run build:staging`
- [ ] Verify no console errors

### Before Production Deployment

- [ ] **CRITICAL:** Set `VITE_ENABLE_E2E_AUTH_BYPASS=false`
- [ ] Update `.env.production` with production API keys
- [ ] Use Stripe live keys (not test keys)
- [ ] Set up production Supabase project
- [ ] Configure OAuth redirect URLs for production domain
- [ ] Set up error logging service
- [ ] Configure CDN (if applicable)
- [ ] Test on staging first
- [ ] Run security audit: `npm audit`
- [ ] Review and approve all dependency updates
- [ ] Create git tag for release
- [ ] Prepare rollback plan

---

## Rollback Strategy

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Promote previous deployment to production
vercel promote [deployment-url]
```

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin master

# Or reset to specific tag
git checkout v1.0.0
git push origin master --force  # USE WITH CAUTION
```

---

## Monitoring

### Production Monitoring

1. **Vercel Analytics**: Enabled by default
   - Page views
   - Performance metrics
   - Core Web Vitals

2. **Error Tracking**: Configured via `VITE_ERROR_LOG_URL`
   - Client-side errors
   - API failures
   - Component crashes

3. **Supabase Monitoring**
   - Database queries
   - API usage
   - Storage usage

### Health Checks

Check these endpoints after deployment:

```bash
# Production
curl https://voiceflowpro.com/
curl https://voiceflowpro.com/api/health

# Staging
curl https://staging.voiceflowpro.com/
curl https://staging.voiceflowpro.com/api/health
```

---

## Troubleshooting

### Issue: Build Fails

**Solution:**
1. Check TypeScript errors: `npm run type-check`
2. Check for missing dependencies: `npm install`
3. Clear build cache: `rm -rf dist node_modules/.vite`
4. Reinstall: `npm ci`

### Issue: Environment Variables Not Loading

**Solution:**
1. Verify file naming: `.env.staging` or `.env.production`
2. Check Vite prefix: All vars must start with `VITE_`
3. Rebuild: `npm run build:staging`
4. In Vercel: Check Environment Variables section

### Issue: OAuth Callback Fails

**Solution:**
1. Verify redirect URL in OAuth provider settings
2. Should be: `https://your-domain.com/auth/callback`
3. Check `VITE_ENABLE_OAUTH=true`
4. Verify Supabase OAuth settings

### Issue: 404 on Page Refresh (SPA Routing)

**Solution:**
1. Verify `vercel.json` has SPA rewrite:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
2. Check Vercel deployment logs
3. Ensure using HTML5 history router (not hash router)

---

## Security Best Practices

### API Keys

- ✅ **DO**: Store in environment variables
- ✅ **DO**: Use different keys for staging/production
- ✅ **DO**: Rotate keys regularly
- ❌ **DON'T**: Commit to git
- ❌ **DON'T**: Share in public channels
- ❌ **DON'T**: Use production keys in development

### Authentication

- ✅ **DO**: Use HTTPS only in production
- ✅ **DO**: Set secure cookie flags
- ✅ **DO**: Implement CSRF protection
- ❌ **DON'T**: Disable E2E auth bypass in production
- ❌ **DON'T**: Use weak session secrets

### Headers

Already configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Performance Optimization

### Bundle Size

Monitor and keep under:
- Main bundle: 250 KB (gzipped)
- Total initial load: 500 KB

```bash
# Check bundle size
npm run build:production
ls -lh dist/assets/*.js
```

### CDN Configuration

Assets are cached for 1 year (immutable):
- JavaScript: `/assets/*.js`
- CSS: `/assets/*.css`
- Images: `/images/*`

### Lazy Loading

Code splitting is configured for:
- Routes (React.lazy)
- Heavy components
- Third-party libraries

---

## Continuous Deployment Workflow

1. **Development**
   ```
   Feature branch → PR → Review → Merge to master
   ```

2. **Staging**
   ```
   Merge to master → CI runs → Deploy to staging → QA testing
   ```

3. **Production**
   ```
   Staging approved → Tag release → Deploy to production → Monitor
   ```

---

## Support

For deployment issues:
- Check [GitHub Actions](https://github.com/your-org/voiceflow-pro/actions)
- Review [Vercel Deployment Logs](https://vercel.com/dashboard)
- Contact: devops@voiceflowpro.com

---

**Last Updated:** 2025-01-15
