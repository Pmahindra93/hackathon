import { type NextRequest, NextResponse } from 'next/server';
import { TikTokTimeMachine, TIME_ERAS } from '../../../lib/video-pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { videoUrl?: string; eraId?: string };
    const { videoUrl, eraId } = body;

    if (!videoUrl || !eraId) {
      return NextResponse.json(
        { error: 'Video URL and era ID are required' },
        { status: 400 }
      );
    }

    // Validate API keys
    if (!process.env.SIEVE_API_KEY || !process.env.ELEVENLABS_API_KEY || !process.env.FAL_KEY || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing required API keys' },
        { status: 500 }
      );
    }

    // Initialize the Time Machine with API configs
    const timeMachine = new TikTokTimeMachine(
      {
        apiKey: process.env.SIEVE_API_KEY,
        baseUrl: 'https://mango.sievedata.com'
      },
      {
        apiKey: process.env.ELEVENLABS_API_KEY,
        baseUrl: 'https://api.elevenlabs.io'
      },
      {
        apiKey: process.env.FAL_KEY,
        baseUrl: 'https://queue.fal.run'
      },
      {
        apiKey: process.env.OPENAI_API_KEY
      }
    );

    console.log(`🚀 Starting transformation to ${eraId} era...`);

    // Transform the video
    const result = await timeMachine.transformVideo(videoUrl, eraId);

    console.log('✅ Transformation completed successfully!');

    return NextResponse.json({
      success: true,
      result: {
        finalVideoUrl: result.finalVideoUrl,
        era: result.metadata.era,
        processingTime: result.metadata.processingTime,
        voiceDetails: {
          voiceName: result.voiceDetails.voiceName,
          transformedText: result.voiceDetails.script.transformedText,
          emotionalTone: result.voiceDetails.script.emotionalTone
        },
        originalDialogue: result.voiceDetails.originalText,
        effects: result.metadata.effects
      }
    });

  } catch (error) {
    console.error('❌ Time Machine transformation failed:', error);

    return NextResponse.json(
      {
        error: 'Transformation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch available eras
export async function GET() {
  try {
    // Return eras directly without instantiating TikTokTimeMachine
    return NextResponse.json({
      success: true,
      eras: TIME_ERAS
    });

  } catch (error) {
    console.error('Failed to fetch eras:', error);

    return NextResponse.json(
      { error: 'Failed to fetch available eras' },
      { status: 500 }
    );
  }
}
