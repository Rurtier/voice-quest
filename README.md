# Epic Quest - Voice-Controlled RPG Adventure

A voice-controlled text-based RPG powered by Claude AI. Choose your genre, create your character, and embark on unique adventures generated dynamically by AI.

## Features

✅ **Multiple Genres**: Fantasy, Sci-Fi, Mystery, Horror, Post-Apocalyptic, Cyberpunk  
✅ **Dynamic Storytelling**: Claude AI generates unique adventures  
✅ **Voice Control**: Speak commands or type them (voice features coming soon)  
✅ **Game State Management**: Health, stamina, inventory, gold tracking  
✅ **Mobile Responsive**: Works great on iPhone and desktop  

## Tech Stack

- **React 19** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** + shadcn/ui components
- **Claude AI API** (Sonnet 4)
- **Firebase** (for save games - coming soon)

## Getting Started

### Prerequisites

- Node.js 18+ (22 recommended)
- pnpm (will be installed automatically)

### Installation

1. Clone or download this project
2. Open the folder in VS Code
3. Open a terminal and run:

```bash
pnpm install
```

### Development

To run the development server:

```bash
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment to Vercel

### Option 1: Via GitHub (Recommended)

1. Create a new GitHub repository
2. Push this code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

3. Go to [vercel.com](https://vercel.com)
4. Click "New Project"
5. Import your GitHub repository
6. Vercel will auto-detect the settings
7. Click "Deploy"

### Option 2: Via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts

## Important Notes

### Claude API

The Claude API integration works in the browser without requiring an API key because it's handled automatically in the Claude.ai artifact environment. 

**For deployment to Vercel**, you have two options:

1. **Keep it simple** (uses your quota): The current code will work as-is on Vercel, but API calls will use your Claude.ai quota
2. **Add API key** (more secure): 
   - Get an API key from [console.anthropic.com](https://console.anthropic.com)
   - Add it as a Vercel environment variable: `VITE_ANTHROPIC_API_KEY`
   - Update the fetch call to include the key

## Project Structure

```
epic-quest-vscode/
├── src/
│   ├── App.tsx              # Main game component
│   ├── main.tsx             # App entry point
│   ├── index.css            # Global styles
│   └── components/
│       └── ui/              # shadcn/ui components
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Roadmap

- [x] Step 1: Menu System & UI
- [x] Step 2: Claude AI Integration
- [ ] Step 3: Enhanced Game State Management
- [ ] Step 4: Better Story Parsing
- [ ] Step 5: Voice Input (Web Speech API)
- [ ] Step 6: Voice Output (Text-to-Speech)
- [ ] Step 7: Firebase Integration for Save Games
- [ ] Step 8: Vercel Deployment

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## Contributing

This is a personal project, but feel free to fork and customize!

## License

MIT
