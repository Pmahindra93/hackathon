import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import OpenAI from "openai";

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY ?? "",
});

// Configure OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const SIEVE_API_KEY = process.env.SIEVE_API_KEY ?? "";
const SIEVE_BASE_URL = "https://mango.sievedata.com/v2";

interface SieveJobResponse {
  id: string;
  status: string;
}

interface SieveJobResult {
  id: string;
  status: string;
  outputs?: {
    clips?: Array<{
      url: string;
      start_time: number;
      end_time: number;
      score: number;
    }>;
    transcript?: string;
    detected_text?: string[];
    description?: string;
  };
}

interface ClipMetadata {
  url: string;
  start_time: number;
  end_time: number;
  score: number;
  transcription?: string;
  textDetection?: string[];
  videoExplanation?: string;
}

interface FalVideoResult {
  video: {
    url: string;
  };
}

interface RequestBody {
  tiktokUrl: string;
  prompt: string;
}

// Generic Sieve job submission
async function submitSieveJob(functionName: string, inputs: Record<string, unknown>): Promise<string> {
  const response = await fetch(`${SIEVE_BASE_URL}/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SIEVE_API_KEY,
    },
    body: JSON.stringify({
      function: functionName,
      inputs: inputs,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sieve API error: ${response.statusText}`);
  }

  const data = await response.json() as SieveJobResponse;
  return data.id;
}

async function getSieveJobResult(jobId: string): Promise<SieveJobResult> {
  const response = await fetch(`${SIEVE_BASE_URL}/jobs/${jobId}`, {
    method: "GET",
    headers: {
      "X-API-Key": SIEVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Sieve API error: ${response.statusText}`);
  }

  return await response.json() as SieveJobResult;
}

async function waitForSieveJob(jobId: string, maxWaitTime = 300000): Promise<SieveJobResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const result = await getSieveJobResult(jobId);

    if (result.status === "finished") {
      return result;
    } else if (result.status === "failed") {
      throw new Error("Sieve job failed");
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error("Sieve job timed out");
}

// Step 1: Split video into clips
async function splitVideoIntoClips(videoUrl: string, query: string): Promise<ClipMetadata[]> {
  console.log("Step 1: Splitting video into clips...");

  const jobId = await submitSieveJob("sieve/moments", {
    video: { url: videoUrl },
    query: query,
    min_clip_length: 3,
    start_time: 0,
    end_time: -1,
    render: true,
  });

  const result = await waitForSieveJob(jobId);
  const clips = result.outputs?.clips ?? [];

  return clips.map((clip) => ({
    url: clip.url,
    start_time: clip.start_time,
    end_time: clip.end_time,
    score: clip.score,
  }));
}

// Step 2a: Transcribe audio for each clip
async function transcribeClip(clipUrl: string): Promise<string> {
  const jobId = await submitSieveJob("sieve/speech_transcription", {
    audio: { url: clipUrl },
  });

  const result = await waitForSieveJob(jobId);
  return result.outputs?.transcript ?? "";
}

// Step 2b: Detect text in video
async function detectTextInClip(clipUrl: string): Promise<string[]> {
  const jobId = await submitSieveJob("sieve/text_detection", {
    video: { url: clipUrl },
  });

  const result = await waitForSieveJob(jobId);
  return result.outputs?.detected_text ?? [];
}

// Step 2c: Explain what happens in the video
async function explainVideoClip(clipUrl: string): Promise<string> {
  const jobId = await submitSieveJob("sieve/video_descriptor", {
    video: { url: clipUrl },
  });

  const result = await waitForSieveJob(jobId);
  return result.outputs?.description ?? "";
}

// Step 2: Extract metadata for all clips
async function extractClipMetadata(clips: ClipMetadata[]): Promise<ClipMetadata[]> {
  console.log("Step 2: Extracting metadata for each clip...");

  const enhancedClips = await Promise.all(
    clips.map(async (clip) => {
      try {
        console.log(`Processing clip ${clip.start_time}s-${clip.end_time}s...`);

        const [transcription, textDetection, videoExplanation] = await Promise.all([
          transcribeClip(clip.url).catch(() => ""),
          detectTextInClip(clip.url).catch(() => []),
          explainVideoClip(clip.url).catch(() => ""),
        ]);

        return {
          ...clip,
          transcription,
          textDetection,
          videoExplanation,
        };
      } catch (error) {
        console.error(`Error processing clip ${clip.start_time}s-${clip.end_time}s:`, error);
        return clip; // Return original clip if metadata extraction fails
      }
    })
  );

  return enhancedClips;
}

// Step 3: Generate script using AI based on clips metadata and user query
async function generateScript(clips: ClipMetadata[], userQuery: string): Promise<string[]> {
  console.log("Step 3: Generating AI script...");

  const clipsContext = clips.map((clip, index) => {
    return `Clip ${index + 1} (${clip.start_time}s-${clip.end_time}s):
- Transcription: ${clip.transcription ?? "No speech detected"}
- Text in video: ${clip.textDetection?.join(", ") ?? "No text detected"}
- Visual description: ${clip.videoExplanation ?? "No description available"}
- Relevance score: ${(clip.score * 100).toFixed(1)}%`;
  }).join("\n\n");

  const prompt = `Based on the following video clips and user query, generate a creative script for a new video.

User Query: "${userQuery}"

Video Clips Analysis:
${clipsContext}

Generate a detailed script with ${clips.length} scenes, where each scene corresponds to one of the clips above. For each scene, provide:
1. A detailed visual description for video generation
2. Actions and mood
3. Camera angles and style

Format your response as a JSON array where each element is a scene description string. Example:
["Scene 1: A vibrant kitchen scene with...", "Scene 2: Close-up shot of hands preparing..."]

Make the script creative, engaging, and inspired by the original clips while following the user's vision.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: "You are a creative video director and scriptwriter. Generate engaging video scripts based on analysis of existing video clips."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content ?? "";

        try {
      const scenes = JSON.parse(response) as unknown;
      return Array.isArray(scenes) && scenes.every(s => typeof s === 'string') ? scenes : [response];
    } catch {
      // If JSON parsing fails, split by sentences or return as single scene
      return response.split('.').filter(s => s.trim().length > 10);
    }
  } catch (error) {
    console.error("Error generating script:", error);
    // Fallback: generate simple descriptions based on clips
    return clips.map((clip, i) =>
      `Scene ${i + 1}: ${clip.videoExplanation ?? `A dynamic video scene based on the user's vision: ${userQuery}`}`
    );
  }
}

// Step 4: Generate video for each scene using Kling
async function generateVideoForScene(sceneDescription: string): Promise<FalVideoResult> {
  console.log("Generating video for scene:", sceneDescription.substring(0, 100) + "...");

  const result = await fal.subscribe("fal-ai/kling-video/v2.1/master/text-to-video", {
    input: {
      prompt: sceneDescription,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        console.log("Fal AI progress:", update.logs?.map(log => log.message).join('\n'));
      }
    },
  });

  return result.data as FalVideoResult;
}

async function generateAllSceneVideos(scenes: string[]): Promise<FalVideoResult[]> {
  console.log("Step 4: Generating videos for all scenes...");

  // Generate videos sequentially to avoid API rate limits
  const generatedVideos: FalVideoResult[] = [];

  for (let i = 0; i < scenes.length; i++) {
    try {
      console.log(`Generating video ${i + 1}/${scenes.length}...`);
      const scene = scenes[i];
      if (scene) {
        const video = await generateVideoForScene(scene);
        generatedVideos.push(video);
      }
    } catch (error) {
      console.error(`Error generating video for scene ${i + 1}:`, error);
      // Continue with next scene even if one fails
    }
  }

  return generatedVideos;
}

// Step 5: Combine videos
async function combineVideos(videoUrls: string[]): Promise<string> {
  console.log("Step 5: Combining videos...");

  // This is a placeholder - in production you'd use a video editing service
  // For now, we'll just return the first video URL as the "combined" result
  // In a real implementation, you'd use services like:
  // - FFmpeg API
  // - Shotstack API
  // - Custom video processing service

  console.log("Note: Video combination is not yet implemented. Returning first video.");
  return videoUrls[0] ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RequestBody;
    const { tiktokUrl, prompt } = body;

    if (!tiktokUrl || !prompt) {
      return NextResponse.json(
        { error: "Missing tiktokUrl or prompt" },
        { status: 400 }
      );
    }

    // Validate API keys
    if (!SIEVE_API_KEY) {
      return NextResponse.json(
        { error: "Sieve API key not configured" },
        { status: 500 }
      );
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "Fal AI API key not configured" },
        { status: 500 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    console.log("Starting enhanced video processing pipeline...");

    // Step 1: Split video into clips
    const clips = await splitVideoIntoClips(tiktokUrl, prompt);
    if (clips.length === 0) {
      return NextResponse.json(
        { error: "No relevant clips found in the video" },
        { status: 404 }
      );
    }

    // Step 2: Extract metadata for each clip
    const enhancedClips = await extractClipMetadata(clips);

    // Step 3: Generate script using AI
    const scriptScenes = await generateScript(enhancedClips, prompt);

    // Step 4: Generate videos for each scene
    const generatedVideos = await generateAllSceneVideos(scriptScenes);

    // Step 5: Combine videos
    const videoUrls = generatedVideos.map(v => v.video.url);
    const finalVideoUrl = await combineVideos(videoUrls);

    return NextResponse.json({
      success: true,
      data: {
        originalVideo: tiktokUrl,
        userPrompt: prompt,
        pipeline: {
          step1_clips: {
            count: clips.length,
            clips: enhancedClips,
          },
          step2_metadata: "Extracted transcription, text detection, and video explanations",
          step3_script: {
            scenes: scriptScenes,
          },
          step4_generated_videos: {
            count: generatedVideos.length,
            videos: generatedVideos,
          },
          step5_final_video: {
            url: finalVideoUrl,
            note: "Video combination is currently a placeholder",
          },
        },
      },
    });

  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      {
        error: "Pipeline processing failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
