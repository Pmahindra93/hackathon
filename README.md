# TikTok AI Video Processor

A modern web application that analyzes TikTok videos using Sieve Data Moments API and generates new videos with Fal AI's Kling text-to-video model.

## Features

- 🎥 **TikTok Video Analysis**: Extract meaningful moments from TikTok videos
- 🤖 **AI-Powered Video Generation**: Create new videos based on your prompts
- 🎨 **Modern UI**: Beautiful, responsive interface with real-time feedback
- ⚡ **Real-time Processing**: Live updates during video processing
- 📱 **Mobile Responsive**: Works seamlessly on all devices

## How It Works

1. **Input**: Provide a TikTok video URL and describe what you want to find or create
2. **Analysis**: Sieve Data Moments API analyzes the video and finds matching moments
3. **Generation**: Fal AI Kling generates a new video based on your prompt and the found moments
4. **Results**: View both the original matching clips and the newly generated video

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- API keys for:
  - [Sieve Data](https://sievedata.com/) - For video analysis and metadata extraction
  - [Fal AI](https://fal.ai/) - For text-to-video generation
  - [OpenRouter](https://openrouter.ai/) - For AI script generation

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   # Sieve Data API Key
   # Get your API key from https://mango.sievedata.com/
   SIEVE_API_KEY=your_sieve_api_key_here

   # Fal AI API Key
   # Get your API key from https://fal.ai/
   FAL_KEY=your_fal_api_key_here

   # OpenRouter API Key
   # Get your API key from https://openrouter.ai/
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Getting API Keys

#### Sieve Data API Key
1. Go to [Sieve Data](https://sievedata.com/)
2. Sign up for an account
3. Navigate to the API settings/dashboard
4. Copy your API key

#### Fal AI API Key
1. Go to [Fal AI](https://fal.ai/)
2. Create an account
3. Go to your dashboard/settings
4. Generate and copy your API key

## Usage

1. **Enter a TikTok URL**: Paste a valid TikTok video URL
2. **Describe your vision**: Write a prompt describing what you want to find in the video or what kind of video you want to generate
3. **Process**: Click "Process Video" and wait for the AI to work its magic
4. **View Results**: See both the matching clips from the original video and the newly generated video

### Example Prompts

- "Find moments with cars"
- "Show scenes with people dancing"
- "Create a video about cooking"
- "Generate a nature-inspired scene"

## API Endpoints

### POST `/api/process`

Processes a TikTok video with the given prompt.

**Request Body:**
```json
{
  "tiktokUrl": "https://www.tiktok.com/@username/video/...",
  "prompt": "Your AI prompt here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalVideo": "...",
    "originalPrompt": "...",
    "enhancedPrompt": "...",
    "sieveResult": {
      "jobId": "...",
      "clipsFound": 3,
      "bestClip": {
        "url": "...",
        "start_time": 10,
        "end_time": 15,
        "score": 0.95
      },
      "allClips": [...]
    },
    "generatedVideo": {
      "video": {
        "url": "..."
      }
    }
  }
}
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Services**:
  - Sieve Data Moments API for video analysis
  - Fal AI Kling for text-to-video generation

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── process/
│   │       └── route.ts     # Main processing API
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── styles/                  # Global styles
└── env.js                   # Environment validation
```

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Make sure your `.env.local` file exists and contains the correct API keys
   - Restart the development server after adding environment variables

2. **"No matching moments found" error**
   - Try a different prompt that might better match the video content
   - Ensure the TikTok URL is publicly accessible

3. **Processing takes too long**
   - Video processing can take several minutes depending on video length
   - Check your API quotas and limits

### Debug Mode

To enable debug logging, add this to your `.env.local`:
```bash
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review API documentation for [Sieve Data](https://sievedata.com/docs) and [Fal AI](https://fal.ai/docs)
- Open an issue in the repository
