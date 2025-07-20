# JustSpeak API Integration Testing Guide

## Overview

The application now has two test files:

1. **`test-user-experience.html`** - A standalone simulation of the complete user experience (no real API calls)
2. **`test-real-api.html`** - A comprehensive API integration tester that connects to your running Next.js application

## Prerequisites

1. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```
   The server should be running on `http://localhost:3000`

2. **Ensure Environment Variables are Set**:
   Your `.env.local` file should have:
   - `OPENAI_API_KEY` - For chat functionality and OpenAI voice services
   - `ELEVENLABS_API_KEY` - For ElevenLabs voice synthesis
   - Supabase credentials for authentication

## Using test-real-api.html

1. Open `test-real-api.html` in your browser (Chrome or Edge recommended)
2. The page will automatically check API status on load

### API Tests Available:

#### 1. API Configuration Status
- Click "Check All APIs" to verify which services are configured
- Shows status for Chat (OpenAI), STT (Speech-to-Text), and TTS (Text-to-Speech) providers

#### 2. Chat API Test
- Enter a message in the text area
- Select conversation mode (Conversation or Learning)
- Click "Send to Chat API" to get AI response
- Learning mode includes grammar/vocabulary assessment

#### 3. Voice Recognition Test
- Select a provider (Browser, OpenAI Whisper, or Google Speech)
- Click the microphone button to start recording
- For API providers, recording stops when you click again
- Browser provider uses continuous recognition

#### 4. Voice Synthesis Test
- Select a provider (Browser, OpenAI TTS, or ElevenLabs)
- Enter text to synthesize
- Click "Synthesize Speech" to hear the output
- "Test ElevenLabs API" directly tests the `/api/speech` endpoint

#### 5. Full Conversation Flow
- Tests the complete conversation loop
- AI speaks greeting → User responds → AI responds → continues...
- Uses selected STT and TTS providers

## Troubleshooting

### Common Issues:

1. **"Error: Network error" or "Failed to fetch"**
   - Ensure Next.js dev server is running (`npm run dev`)
   - Check if it's running on port 3000
   - If using a different port, update `API_BASE` in the HTML file

2. **"API error: 503 - Speech service not configured"**
   - Check your `.env.local` file has the correct API keys
   - Restart the dev server after adding environment variables

3. **No audio playback for ElevenLabs**
   - Check browser console for CORS errors
   - Verify ElevenLabs API key is valid
   - Check API usage limits

4. **Chat API returns generic responses**
   - Verify OpenAI API key is correct and has credits
   - Check the console output in the test page for detailed errors

### Console Output

The test page includes a console at the bottom showing:
- API request/response details
- Error messages with timestamps
- Audio blob information for voice synthesis
- Transcription results

## API Endpoints Being Tested

- `/api/config/status` - Check API configuration
- `/api/chat` - Chat conversation with AI
- `/api/voice/transcribe` - Speech-to-text conversion
- `/api/voice/synthesize` - Text-to-speech (OpenAI)
- `/api/speech` - Text-to-speech (ElevenLabs)

## Expected Behavior

When everything is working correctly:

1. **Chat API**: Should return contextually relevant responses about the topic you mention
2. **Voice Recognition**: Should accurately transcribe your speech
3. **Voice Synthesis**: Should produce natural-sounding speech
4. **Full Conversation**: Should maintain a flowing conversation with voice input/output

## Security Note

The test files expose API endpoints directly. These are for development testing only and should not be deployed to production.