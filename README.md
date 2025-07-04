# TalkTime - Conversational English Practice App

A judgment-free conversation partner that helps students practice speaking English through natural AI-powered conversations.

## Quick Start (Simple HTML Version)

Due to disk space constraints, use the lightweight version:

1. **Set up OpenAI API key:**
```bash
# Create .env file
echo "OPENAI_API_KEY=your_actual_api_key_here" > .env
```

2. **Install minimal dependencies:**
```bash
npm install express cors dotenv
```

3. **Run the simple server:**
```bash
npm run simple
# or
node simple-server.js
```

4. **Open [http://localhost:3001](http://localhost:3001)**

## Getting an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file
6. **Never commit the .env file to git!**

## Full Next.js Version (when you have disk space)

1. **Free up ~1GB disk space**
2. **Install all dependencies:**
```bash
npm install
```
3. **Run development server:**
```bash
npm run dev
```

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Voice:** Web Speech API, OpenAI Whisper (fallback)
- **Backend:** Node.js/Express (to be implemented)
- **Database:** PostgreSQL (to be implemented)
- **AI:** OpenAI GPT-4

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── public/          # Static assets
└── CLAUDE.md        # AI development guidelines
```