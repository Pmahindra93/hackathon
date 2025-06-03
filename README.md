# 🎭 TikTok Time Machine

Transform your videos into different historical eras with AI-powered voice, visuals, and music! This application uses cutting-edge AI to transport your content through time.

## ✨ Features

- **🎙️ Era-Specific Voice Generation**: Transform dialogue with authentic period voices using ElevenLabs
- **🎨 Visual Style Transfer**: Apply historical visual styles and backgrounds using Fal AI
- **📊 AI Video Analysis**: Extract transcripts and analyze content using Sieve AI
- **🎵 Period-Appropriate Music**: Generate background music that matches each era
- **⚡ Real-time Processing**: Watch your video transform through a comprehensive pipeline

## 🕰️ Available Eras

- **🎭 1920s Silent Film**: Black & white film grain with dramatic piano accompaniment
- **📺 1950s TV Show**: Clean vintage look with big band swing music
- **🌈 1980s VHS Retro**: Neon colors and synthwave aesthetic with electronic beats
- **🏰 Medieval Chronicle**: Painted manuscript style with lute music
- **👑 Victorian Era**: Sepia tones with classical orchestral arrangements

## 🚀 Quick Start

### Prerequisites

You'll need API keys from the following services:

1. **Sieve AI** - [Get API key](https://mango.sieve.ai)
2. **OpenAI** - [Get API key](https://platform.openai.com)
3. **ElevenLabs** - [Get API key](https://elevenlabs.io)
4. **Fal AI** - [Get API key](https://fal.ai)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd tiktok-time-machine
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file with your API keys:
   ```env
   SIEVE_API_KEY=your_sieve_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   FAL_KEY=your_fal_api_key_here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎬 How It Works

The Time Machine uses a sophisticated 5-phase pipeline:

1. **📊 Video Analysis**: Extract dialogue, scenes, and speakers using Sieve AI
2. **🎭 Voice Transformation**: Transform script to match era style and generate authentic voice with ElevenLabs
3. **🎨 Visual Effects**: Apply era-specific visual styles and backgrounds using Fal AI
4. **🎵 Audio Synchronization**: Sync the new voice with the video using lip-sync technology
5. **🎞️ Final Composition**: Add period-appropriate background music and final touches

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Services**:
  - Sieve AI (video analysis, lip-sync, visual effects)
  - OpenAI GPT-4o (script transformation)
  - ElevenLabs (voice generation)
  - Fal AI (style transfer, background generation)
- **Processing**: FFmpeg for video manipulation

## 📝 Usage

1. **Upload Video**: Paste a video URL (supports most formats)
2. **Choose Era**: Select from 5 historical time periods
3. **Transform**: Watch the AI pipeline process your video
4. **Download**: Get your transformed video with new voice, visuals, and music

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── api/process/    # API endpoint for transformations
│   └── page.tsx        # Main UI component
└── lib/
    └── video-pipeline.ts # Core Time Machine logic
```

### Key Components

- `TikTokTimeMachine`: Main pipeline class handling all transformations
- `TIME_ERAS`: Configuration for different historical periods
- `ERA_VOICES`: Voice profiles for each era using ElevenLabs

## 🚨 Troubleshooting

- **API Errors**: Ensure all API keys are valid and have sufficient credits
- **Video Processing**: Large videos may take several minutes to process
- **Network Issues**: Some APIs require external access - consider using ngrok for development

## 📄 License

This project is built with the [T3 Stack](https://create.t3.gg/) and uses various AI services. Please check individual service terms for commercial usage.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new historical eras
- Improve the transformation pipeline
- Enhance the UI/UX
- Fix bugs and optimize performance
