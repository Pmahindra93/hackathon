import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const execAsync = promisify(exec);

// Types and Interfaces
interface TimeEra {
  id: string;
  name: string;
  displayName: string;
  style: string;
  audioStyle: string;
  visualEffects: string[];
  scriptStyle: string;
  musicPrompt: string;
  backgroundPrompt: string;
}

interface EraVoiceProfile {
  name: string;
  elevenLabsVoiceId: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
  };
  speechPattern: string;
  accent: string;
}

interface Scene {
  start_time?: number;
  end_time?: number;
  description?: string;
}

interface TranscriptionSegment {
  text: string;
  start_time?: number;
  end_time?: number;
}

interface Speaker {
  speaker_id?: string;
  segments?: Array<{ start_time: number; end_time: number; text: string }>;
}

interface SieveResponse {
  scenes?: Scene[];
  text?: string;
  transcription?: string;
  duration?: number;
  speakers?: Speaker[];
  url?: string;
  video_url?: string;
  audio_url?: string;
  id?: string;
  outputs?: unknown;
  status?: string;
  error?: string;
  progress?: number;
}

interface SieveJobResponse {
  id?: string;
  status?: string;
  outputs?: unknown;
  error?: string;
  progress?: number;
}

interface FalResponse {
  video_url?: string;
  url?: string;
  audio_url?: string;
  images?: Array<{ url: string }>;
}

interface VoiceDetails {
  script: {
    transformedText: string;
    stageDirections: string[];
    emotionalTone: string;
    pacing: string;
    keyPhrases: string[];
    backgroundDescription: string;
  };
  audioUrl: string;
  voiceName: string;
  originalText: string;
}

interface VideoAnalysis {
  scenes: Scene[];
  dialogue: string;
  speakers: Speaker[];
  duration: number;
  audioUrl: string;
  keyMoments: Scene[];
}

interface TransformationResult {
  finalVideoUrl: string;
  voiceDetails: VoiceDetails;
  transformationData: VideoAnalysis;
  metadata: {
    era: TimeEra;
    processingTime: number;
    effects: string[];
  };
}

// Configuration
const TIME_ERAS: TimeEra[] = [
  {
    id: "1920s",
    name: "1920s Silent Film",
    displayName: "🎭 1920s Silent Film",
    style: "black and white, film grain, dramatic lighting, art deco, sepia tone, vintage camera work",
    audioStyle: "piano ragtime, dramatic orchestral stings, silent film music",
    visualEffects: ["sepia", "film_grain", "vignette", "title_cards"],
    scriptStyle: "dramatic title cards, theatrical expressions, exaggerated gestures, silent film intertitles",
    musicPrompt: "1920s ragtime piano with dramatic orchestral stings and vintage sound quality",
    backgroundPrompt: "1920s art deco interior, vintage theater stage, speakeasy atmosphere"
  },
  {
    id: "1950s",
    name: "1950s TV Show",
    displayName: "📺 1950s TV Show",
    style: "clean vintage look, perfect lighting, family-friendly, technicolor, classic TV aesthetic",
    audioStyle: "big band swing, cheerful jingles, announcer voice, wholesome music",
    visualEffects: ["vintage_color", "slight_grain", "tv_scan_lines"],
    scriptStyle: "wholesome narration, commercial-style enthusiasm, proper pronunciation",
    musicPrompt: "upbeat 1950s big band swing with cheerful TV show energy",
    backgroundPrompt: "1950s kitchen or living room, pastel colors, vintage TV studio set"
  },
  {
    id: "1980s",
    name: "1980s VHS",
    displayName: "🌈 1980s VHS Retro",
    style: "neon colors, VHS artifacts, synth-wave aesthetic, retro-futuristic, cyberpunk elements",
    audioStyle: "synthesizers, drum machines, retro-futuristic, electronic beats",
    visualEffects: ["vhs_artifacts", "neon_glow", "scan_lines", "chromatic_aberration"],
    scriptStyle: "radical slang, over-the-top energy, commercial enthusiasm, action movie intensity",
    musicPrompt: "1980s synthwave with electronic drums and retro-futuristic atmosphere",
    backgroundPrompt: "neon-lit 1980s environment, cyberpunk cityscape, retro-futuristic interior"
  },
  {
    id: "medieval",
    name: "Medieval Chronicle",
    displayName: "🏰 Medieval Times",
    style: "painted manuscript style, medieval clothing, castle settings, Renaissance painting aesthetic",
    audioStyle: "lute music, gregorian chants, medieval instruments, orchestral",
    visualEffects: ["painted_texture", "parchment_overlay", "medieval_filter"],
    scriptStyle: "ye olde English, formal proclamations, epic storytelling, courtly language",
    musicPrompt: "medieval lute and orchestral music with epic fantasy atmosphere",
    backgroundPrompt: "medieval castle interior, throne room, medieval village or monastery"
  },
  {
    id: "victorian",
    name: "Victorian Era",
    displayName: "👑 Victorian Elegance",
    style: "sepia tones, formal Victorian clothing, elegant interiors, portrait photography style",
    audioStyle: "classical music, proper British accent, formal speech patterns",
    visualEffects: ["sepia_tone", "vintage_portrait", "soft_lighting"],
    scriptStyle: "formal Victorian language, proper grammar, sophisticated vocabulary",
    musicPrompt: "classical Victorian-era music with elegant orchestral arrangements",
    backgroundPrompt: "Victorian mansion interior, library, elegant Victorian parlor"
  }
];

const ERA_VOICES: EraVoiceProfile[] = [
  {
    name: "1920s Radio Announcer",
    elevenLabsVoiceId: "pNInz6obpgDQGcFmaJgB", // Adam - dramatic
    voiceSettings: { stability: 0.8, similarity_boost: 0.8, style: 0.9 },
    speechPattern: "dramatic pauses, theatrical emphasis, transatlantic accent",
    accent: "mid-atlantic"
  },
  {
    name: "1950s TV Host",
    elevenLabsVoiceId: "ErXwobaYiN019PkySvjV", // Antoni - friendly
    voiceSettings: { stability: 0.9, similarity_boost: 0.7, style: 0.6 },
    speechPattern: "enthusiastic, wholesome, clear pronunciation",
    accent: "general american"
  },
  {
    name: "1980s Action Hero",
    elevenLabsVoiceId: "VR6AewLTigWG4xSOukaG", // Arnold-like
    voiceSettings: { stability: 0.7, similarity_boost: 0.9, style: 0.8 },
    speechPattern: "confident, slightly robotic, action movie intensity",
    accent: "slight austrian"
  },
  {
    name: "Medieval Storyteller",
    elevenLabsVoiceId: "pqHfZKP75CvOlQylNhV4", // Deep, wise
    voiceSettings: { stability: 0.9, similarity_boost: 0.6, style: 0.7 },
    speechPattern: "slow, deliberate, mystical, formal",
    accent: "slight british"
  },
  {
    name: "Victorian Narrator",
    elevenLabsVoiceId: "onwK4e9ZLuTAKqWW03F9", // Refined british
    voiceSettings: { stability: 0.8, similarity_boost: 0.8, style: 0.5 },
    speechPattern: "proper, articulate, sophisticated",
    accent: "received pronunciation"
  }
];

// Zod Schema for LLM responses
const EraTransformationSchema = z.object({
  transformedText: z.string().describe('The dialogue transformed to match the era style'),
  stageDirections: z.array(z.string()).describe('Stage directions for dramatic pauses and emphasis'),
  emotionalTone: z.string().describe('The emotional tone to convey'),
  pacing: z.string().describe('Speaking pace and rhythm'),
  keyPhrases: z.array(z.string()).describe('Important phrases that define the era'),
  backgroundDescription: z.string().describe('Description of ideal background setting for this era')
});

// Configuration Interfaces
interface SieveConfig {
  apiKey: string;
  baseUrl: string;
}

interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
}

interface FalAIConfig {
  apiKey: string;
  baseUrl: string;
}

interface OpenAIConfig {
  apiKey: string;
}

export class TikTokTimeMachine {
  private sieveConfig: SieveConfig;
  private elevenLabsConfig: ElevenLabsConfig;
  private falAIConfig: FalAIConfig;
  private openAIConfig: OpenAIConfig;
  private outputDir: string;

  constructor(
    sieveConfig: SieveConfig,
    elevenLabsConfig: ElevenLabsConfig,
    falAIConfig: FalAIConfig,
    openAIConfig: OpenAIConfig,
    outputDir = './output'
  ) {
    this.sieveConfig = sieveConfig;
    this.elevenLabsConfig = elevenLabsConfig;
    this.falAIConfig = falAIConfig;
    this.openAIConfig = openAIConfig;
    this.outputDir = outputDir;
  }

  // Main transformation pipeline
  async transformVideo(videoUrl: string, eraId: string): Promise<TransformationResult> {
    const startTime = Date.now();
    console.log(`🎬 Starting Time Machine transformation to ${eraId}...`);

    try {
      // Get era configuration
      const era = TIME_ERAS.find(e => e.id === eraId);
      if (!era) {
        throw new Error(`Era ${eraId} not found`);
      }

      // Phase 1: Analyze the original video
      console.log('📊 Phase 1: Analyzing video...');
      const analysis = await this.analyzeVideo(videoUrl);
      console.log('✅ Phase 1 complete. Analysis result:', {
        dialogue: analysis.dialogue.substring(0, 100) + '...',
        dialogueLength: analysis.dialogue.length,
        scenesCount: analysis.scenes.length,
        speakersCount: analysis.speakers.length
      });

      // Phase 2: Transform script and generate voice
      console.log('🎭 Phase 2: Transforming voice and script...');
      console.log('📝 Original dialogue:', analysis.dialogue);
      const voiceTransform = await this.transformVoiceForEra(analysis.dialogue, era);

      // Phase 3: Apply visual transformations
      console.log('🎨 Phase 3: Applying visual effects...');
      const visuallyTransformed = await this.applyVisualTransformations(videoUrl, era);

      // Phase 4: Sync voice with video
      console.log('🎵 Phase 4: Syncing voice...');
      const lipsyncedVideo = await this.syncVoiceWithVideo(visuallyTransformed, voiceTransform.audioUrl);

      // Phase 5: Final composition
      console.log('🎞️ Phase 5: Final composition...');
      const finalVideo = await this.createFinalComposition(lipsyncedVideo, era, voiceTransform);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Transformation complete in ${processingTime}ms`);

      return {
        finalVideoUrl: finalVideo,
        voiceDetails: voiceTransform,
        transformationData: analysis,
        metadata: {
          era,
          processingTime,
          effects: era.visualEffects
        }
      };
    } catch (error) {
      console.error('❌ Time Machine transformation failed:', error);
      throw error;
    }
  }

  // Phase 1: Video Analysis using Sieve models
  private async analyzeVideo(videoUrl: string): Promise<VideoAnalysis> {
    console.log('🔍 Analyzing video with Sieve models...');

    // Run multiple analyses in parallel
    const [scenes, transcription, speakers] = await Promise.all([
      this.callSieve('sieve/scene-detection', {
        video: { url: videoUrl },
        backend: "base",
        return_scenes: true,
        threshold: 1
      }),
      this.callSieve('sieve/transcribe', {
        file: { url: videoUrl },
        backend: "elevenlabs",
        word_level_timestamps: true,
        diarization_backend: "elevenlabs",
        source_language: "auto"
      }),
      this.callSieve('sieve/active_speaker_detection', {
        file: { url: videoUrl }
      })
    ]);

    // Extract dialogue text
    const dialogue = Array.isArray(transcription)
      ? (transcription as TranscriptionSegment[]).map((segment: TranscriptionSegment) => segment.text).join(' ')
      : transcription?.text ?? transcription?.transcription ?? '';

    return {
      scenes: scenes?.scenes ?? [],
      dialogue: dialogue,
      speakers: speakers?.speakers ?? [],
      duration: transcription?.duration ?? 30,
      audioUrl: videoUrl,
      keyMoments: scenes?.scenes?.slice(0, 5) ?? []
    };
  }

  // Phase 2: Voice and Script Transformation
  private async transformVoiceForEra(originalText: string, era: TimeEra): Promise<VoiceDetails> {
    console.log(`🎙️ Transforming voice for ${era.name}...`);

    // Find matching voice profile
    const voiceProfile = ERA_VOICES.find(v =>
      v.name.toLowerCase().includes(era.id) ||
      era.name.toLowerCase().includes(v.name.split(' ')[0]?.toLowerCase() ?? '')
    ) ?? ERA_VOICES[0]!;

    // Transform script with LLM
    console.log('🤖 Calling OpenAI to transform script...');
    const { object: eraScript } = await generateObject({
      model: openai('gpt-4.1-mini'),
      schema: EraTransformationSchema,
      prompt: `
        Transform this modern dialogue into authentic ${era.name} style:
        "${originalText}"

        Era Requirements:
        - Time Period: ${era.name}
        - Language Style: ${era.scriptStyle}
        - Voice Pattern: ${voiceProfile.speechPattern}
        - Accent: ${voiceProfile.accent}

        Make it entertaining and authentic to the era while preserving the core message.
        Include natural pauses and emphasis that would work well with voice synthesis.

        Example transformations:
        - Modern: "Hey guys, what's up!"
        - 1920s: "Greetings, distinguished ladies and gentlemen!"
        - Medieval: "Hark! Noble lords and fair maidens!"
        - 1980s: "Yo, what's happening, dudes!"
      `,
      temperature: 0.7,
    });
    console.log('✅ OpenAI script transformation complete:', eraScript.transformedText.substring(0, 100) + '...');

    // Try to generate voice with ElevenLabs
    let audioUrl = '';
    try {
      console.log('🎤 Generating voice with ElevenLabs...');
      audioUrl = await this.generateVoiceWithElevenLabs(
        eraScript.transformedText,
        voiceProfile
      );
      console.log('✅ Voice generation successful');
    } catch (error) {
      console.error('❌ Voice generation failed:', error);
      console.log('⚠️ Continuing pipeline without voice synthesis');
      // Continue with empty audioUrl - pipeline will skip lipsync
    }

    return {
      script: eraScript,
      audioUrl,
      voiceName: voiceProfile.name,
      originalText
    };
  }

    // ElevenLabs voice generation
  private async generateVoiceWithElevenLabs(text: string, voiceProfile: EraVoiceProfile): Promise<string> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceProfile.elevenLabsVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsConfig.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: voiceProfile.voiceSettings
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log(`✅ ElevenLabs generated ${audioBuffer.byteLength} bytes of audio`);

      // Use ngrok-based upload for Sieve accessibility
      return await this.uploadAudioBuffer(audioBuffer, 'generated_voice.mp3');
    } catch (error) {
      console.error('ElevenLabs voice generation failed:', error);
      throw error;
    }
  }

  // Phase 3: Visual Transformations
  private async applyVisualTransformations(videoUrl: string, era: TimeEra): Promise<string> {
    console.log(`🎨 Applying ${era.name} visual effects...`);

    try {
      // Step 1: Remove background
      const backgroundRemoved = await this.callSieve('sieve/background-removal', {
        input_file: { url: videoUrl },
        backend: "vanish",
        output_type: "masked_frame",
        video_output_format: "mp4"
      });

      // Step 2: Generate era-appropriate background
      const backgroundUrl = await this.generateEraBackground(era);

      // Step 3: Apply style transfer with Fal
      const styledVideo = await this.callFal('fal-ai/fast-video-style-transfer', {
        video_url: backgroundRemoved?.url ?? videoUrl,
        style_prompt: era.style,
        background_image_url: backgroundUrl,
        strength: 0.8
      });

      return styledVideo?.video_url ?? styledVideo?.url ?? videoUrl;
    } catch (error) {
      console.error('Visual transformation failed:', error);
      // Fallback: return original video
      return videoUrl;
    }
  }

  // Generate era-appropriate background
  private async generateEraBackground(era: TimeEra): Promise<string> {
    try {
      const backgroundImage = await this.callFal('fal-ai/flux/schnell', {
        prompt: `${era.backgroundPrompt}, highly detailed, cinematic lighting, ${era.style}`,
        image_size: 'landscape_16_9',
        num_inference_steps: 4
      });

      return backgroundImage?.images?.[0]?.url ?? '';
    } catch (error) {
      console.error('Background generation failed:', error);
      return ''; // Return empty string for fallback
    }
  }

  // Phase 4: Voice Synchronization
  private async syncVoiceWithVideo(videoUrl: string, audioUrl: string): Promise<string> {
    console.log('🎵 Syncing voice with video...');

    // Skip lipsync if no audio URL provided (voice generation failed)
    if (!audioUrl || audioUrl.trim() === '') {
      console.log('⚠️ No audio URL provided, skipping lipsync and returning original video');
      return videoUrl;
    }

    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retrying lipsync (attempt ${attempt + 1}/${maxRetries + 1})...`);
        }

        const lipsyncResult = await this.callSieve('sieve/lipsync', {
          file: { url: videoUrl },
          audio: { url: audioUrl },
          backend: "sievesync-1.1",
          enable_multispeaker: false,
          enhance: "default",
          check_quality: false,
          downsample: false,
          cut_by: "audio"
        });

        console.log(`✅ Lipsync succeeded on attempt ${attempt + 1}`);
        return lipsyncResult?.url ?? lipsyncResult?.video_url ?? videoUrl;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Lipsync attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Wait a bit before retrying
          const waitTime = (attempt + 1) * 5000; // 5s, 10s
          console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error('❌ Lipsync failed after all retries, trying audio replacement fallback');

    try {
      // Fallback: return video with replaced audio track
      const audioReplacedVideo = await this.replaceAudioTrack(videoUrl, audioUrl);
      console.log('✅ Audio replacement successful, continuing pipeline');
      return audioReplacedVideo;
    } catch (fallbackError) {
      console.error('❌ Audio replacement also failed:', fallbackError);
      console.log('⚠️ Continuing pipeline with original video (no voice sync)');
      // Return original video to keep pipeline going
      return videoUrl;
    }
  }

  // Phase 5: Final Composition
  private async createFinalComposition(videoUrl: string, era: TimeEra, _voiceDetails: VoiceDetails): Promise<string> {
    console.log('🎞️ Creating final composition...');

    try {
      // Generate era-appropriate background music
      const musicUrl = await this.generateBackgroundMusic(era);

      // Mix video with background music
      const finalVideo = await this.mixVideoWithMusic(videoUrl, musicUrl, era);

      return finalVideo;
    } catch (error) {
      console.error('Final composition failed:', error);
      return videoUrl; // Return video without music as fallback
    }
  }

  // Generate background music for era
  private async generateBackgroundMusic(era: TimeEra): Promise<string> {
    try {
      // Use Fal or other music generation service
      const music = await this.callFal('fal-ai/musicgen', {
        prompt: era.musicPrompt,
        duration: 30,
        model: 'musicgen-small'
      });

      return music?.audio_url ?? music?.url ?? '';
    } catch (error) {
      console.error('Music generation failed:', error);
      return '';
    }
  }

  // Utility: Enhance audio quality
  private async mixVideoWithMusic(videoUrl: string, _musicUrl: string, _era: TimeEra): Promise<string> {
    try {
      // Enhance audio quality using Sieve
      console.log('🎵 Enhancing audio quality...');
      const enhanced = await this.callSieve('sieve/audio-enhance', {
        file: { url: videoUrl },
        backend: "auphonic",
        task: "all",
        enhancement_steps: 64
      });

      return enhanced?.url ?? videoUrl;
    } catch (error) {
      console.error('Audio enhancement failed:', error);
      return videoUrl;
    }
  }

  // Utility Methods
  private async callSieve(functionName: string, inputs: Record<string, unknown>): Promise<SieveResponse | null> {
    try {
      const response = await fetch(`${this.sieveConfig.baseUrl}/v2/push`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.sieveConfig.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: functionName,
          inputs: inputs
        })
      });

      const result = await response.json() as SieveJobResponse;

      if (result.id) {
        return await this.pollSieveJob(result.id);
      }

      return result;
    } catch (error) {
      console.error(`Sieve ${functionName} failed:`, error);
      throw error;
    }
  }

  private async callFal(modelName: string, inputs: Record<string, unknown>): Promise<FalResponse | null> {
    try {
      const response = await fetch(`${this.falAIConfig.baseUrl}/${modelName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.falAIConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs)
      });

      const result = await response.json() as FalResponse;
      return result;
    } catch (error) {
      console.error(`Fal ${modelName} failed:`, error);
      throw error;
    }
  }

  private async pollSieveJob(jobId: string): Promise<SieveResponse | null> {
    const maxAttempts = 60; // 10 minutes max
    const pollInterval = 10000; // 10 seconds

    console.log(`🔄 Starting to poll Sieve job ${jobId}...`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.sieveConfig.baseUrl}/v2/jobs/${jobId}`, {
          headers: {
            'X-API-Key': this.sieveConfig.apiKey,
          },
        });

        const job = await response.json() as SieveJobResponse;

        console.log(`🔍 Job ${jobId} status: ${job.status} (attempt ${attempt + 1})`);

        if (job.status === 'completed' || job.status === 'finished') {
          console.log(`✅ Job ${jobId} ${job.status}! Getting outputs...`);
          return job.outputs as SieveResponse;
        } else if (job.status === 'failed' || job.status === 'error') {
          console.error(`❌ Job ${jobId} failed:`, job.error);
          throw new Error(`Sieve job failed: ${job.error ?? 'Unknown error'}`);
        }

        // Log progress with more detail
        if (job.progress) {
                     console.log(`⏳ Job ${jobId} progress: ${job.progress}% (${attempt * 10}s elapsed)`);
         } else {
           console.log(`⏳ Job ${jobId} status: ${job.status} (${attempt * 10}s elapsed)`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        // Wait a bit before retrying on error
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Job polling timeout for ${jobId} after ${maxAttempts * 10} seconds`);
  }

      // Helper method to make files publicly accessible via ngrok
  private async makeFilePublic(localFilePath: string, fileName: string): Promise<string> {
    if (process.env.NODE_ENV === 'development') {
      // Copy to public folder
      const publicPath = path.join(process.cwd(), 'public', 'uploads', fileName);
      await fs.mkdir(path.dirname(publicPath), { recursive: true });
      await fs.copyFile(localFilePath, publicPath);

      // Get base URL and ensure it has proper protocol
      let baseUrl = process.env.NGROK_URL ?? 'http://localhost:3000';

      // Fix missing protocol if needed
      if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }

      const publicUrl = `${baseUrl}/uploads/${fileName}`;
      console.log(`📤 File made publicly accessible: ${publicUrl}`);
      return publicUrl;
    }

    // Production: would use cloud storage
    throw new Error('Production file hosting not implemented yet');
  }

  // Updated uploadAudioBuffer method using ngrok
  private async uploadAudioBuffer(buffer: ArrayBuffer, filename: string): Promise<string> {
    try {
      // Save locally first
      const tempPath = path.join(this.outputDir, filename);
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      await fs.writeFile(tempPath, Buffer.from(buffer));
      console.log(`💾 Audio saved locally: ${tempPath}`);

      // Make publicly accessible via ngrok
      return await this.makeFilePublic(tempPath, filename);
    } catch (error) {
      console.error('Audio file handling failed:', error);
      throw error;
    }
  }

  private async replaceAudioTrack(videoUrl: string, audioUrl: string): Promise<string> {
    // Fallback audio replacement using FFmpeg or similar
    try {
      const outputPath = path.join(this.outputDir, `replaced_audio_${Date.now()}.mp4`);

      // This would need FFmpeg installed
      await execAsync(`ffmpeg -i "${videoUrl}" -i "${audioUrl}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${outputPath}"`);

      return outputPath;
    } catch (error) {
      console.error('Audio replacement failed:', error);
      return videoUrl;
    }
  }

  // Quick preview generation for demos
  async generateQuickPreview(videoUrl: string, eraId: string): Promise<string> {
    console.log(`⚡ Generating quick preview for ${eraId}...`);

    const era = TIME_ERAS.find(e => e.id === eraId);
    if (!era) throw new Error(`Era ${eraId} not found`);

    try {
      // Quick style transfer without full pipeline
      const preview = await this.callFal('fal-ai/fast-video-style-transfer', {
        video_url: videoUrl,
        style_prompt: era.style,
        strength: 0.6,
        duration: 10 // Limit to 10 seconds for preview
      });

      return preview?.video_url ?? preview?.url ?? videoUrl;
    } catch (error) {
      console.error('Quick preview failed:', error);
      throw error;
    }
  }

  // Get available eras for UI
  getAvailableEras(): TimeEra[] {
    return TIME_ERAS;
  }

  // Get voice preview for era
  async getVoicePreview(eraId: string, sampleText = "Welcome to this amazing transformation!"): Promise<string> {
    const era = TIME_ERAS.find(e => e.id === eraId);
    if (!era) throw new Error(`Era ${eraId} not found`);

    const voiceProfile = ERA_VOICES.find(v =>
      v.name.toLowerCase().includes(era.id)
    ) ?? ERA_VOICES[0]!;

    return await this.generateVoiceWithElevenLabs(sampleText, voiceProfile);
  }
}

// Export for use
export { TIME_ERAS, ERA_VOICES };
export type { TimeEra, TransformationResult, VideoAnalysis };
