# Deployment Guide for Epic Quest RPG

## Quick Start - Deploy to Vercel in 5 Minutes

### Method 1: GitHub + Vercel (Recommended)

**Step 1: Create a GitHub Repository**
1. Go to [github.com](https://github.com) and sign in
2. Click "+" in the top right, then "New repository"
3. Name it "epic-quest-rpg"
4. Make it Public or Private (your choice)
5. Click "Create repository"

**Step 2: Push Your Code to GitHub**
Open a terminal in your project folder and run:
```bash
git init
git add .
git commit -m "Initial commit - Epic Quest RPG"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/epic-quest-rpg.git
git push -u origin main
```

**Step 3: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com) and sign up (use GitHub account)
2. Click "Add New..." → "Project"
3. Import your "epic-quest-rpg" repository
4. Vercel will auto-detect these settings:
   - Framework Preset: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. Click "Deploy"
6. Wait 2-3 minutes for deployment
7. Your game is live! 🎉

### Method 2: Vercel CLI (Faster)

**Step 1: Install Vercel CLI**
```bash
npm i -g vercel
```

**Step 2: Deploy**
Navigate to your project folder and run:
```bash
vercel
```

Answer the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- What's your project's name? **epic-quest-rpg**
- In which directory is your code located? **./**
- Want to override settings? **N**

Your game will be deployed in about 2 minutes!

## Testing Your Deployment

Once deployed, test these features:
1. ✅ Main menu loads
2. ✅ Genre selection works
3. ✅ Character creation works
4. ✅ Game starts and displays welcome message
5. ✅ Type a command and get Claude's response
6. ✅ Stats update when you take damage or find items
7. ✅ Works on your iPhone (open the Vercel URL)

## Troubleshooting

### Build Fails
If the build fails, check:
1. Make sure all dependencies are in `package.json`
2. Run `pnpm build` locally to test
3. Check the Vercel build logs for errors

### Claude API Not Working
The Claude API should work automatically. If it doesn't:
1. Check browser console for errors
2. Make sure you're not hitting rate limits
3. Try adding an API key (see below)

### Adding Your Own API Key (Optional)

If you want to use your own Anthropic API key:

**Step 1: Get API Key**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new key

**Step 2: Add to Vercel**
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add new variable:
   - Name: `VITE_ANTHROPIC_API_KEY`
   - Value: Your API key
   - Environment: Production, Preview, Development
4. Redeploy your project

**Step 3: Update Code**
In `src/App.tsx`, find the `fetch` call and add the header:
```typescript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
    "anthropic-version": "2023-06-01"
  },
  // ... rest of code
})
```

## Custom Domain (Optional)

To add a custom domain to your Vercel deployment:
1. Go to your project settings in Vercel
2. Domains → Add Domain
3. Enter your domain (e.g., `epic-quest.com`)
4. Follow the DNS configuration instructions
5. Wait for DNS to propagate (5-60 minutes)

## Monitoring & Analytics

Vercel provides:
- Real-time logs
- Analytics dashboard
- Performance monitoring
- Error tracking

Access these in your Vercel project dashboard.

## Updating Your Deployment

After making changes:

**If using GitHub:**
```bash
git add .
git commit -m "Description of changes"
git push
```
Vercel will automatically redeploy!

**If using Vercel CLI:**
```bash
vercel --prod
```

## Performance Tips

1. **Enable Analytics**: Turn on Vercel Analytics for insights
2. **Add Caching**: Vercel automatically caches static assets
3. **Monitor Usage**: Check the Vercel dashboard for API usage
4. **Optimize Images**: If you add images, use Next.js Image or similar

## Cost

- **Vercel**: Free tier is generous (100GB bandwidth/month)
- **Claude API**: Pay per token (very affordable for personal use)
- **Total**: Should be $0-5/month for personal use

## Need Help?

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Claude API Docs: [docs.anthropic.com](https://docs.anthropic.com)
- Vite Docs: [vitejs.dev](https://vitejs.dev)

## Next Steps

Once deployed:
1. Share the URL with friends
2. Test on your iPhone
3. Add Firebase for save games (Step 7)
4. Add voice features (Steps 5 & 6)
5. Customize genres and starting scenarios

Enjoy your AI-powered RPG adventure! 🎮✨
