"use client";

import { useState } from "react";

interface ClipMetadata {
  url: string;
  start_time: number;
  end_time: number;
  score: number;
  transcription?: string;
  textDetection?: string[];
  videoExplanation?: string;
}

interface ProcessingResult {
  success: boolean;
  data?: {
    originalVideo: string;
    userPrompt: string;
    pipeline: {
      step1_clips: {
        count: number;
        clips: ClipMetadata[];
      };
      step2_metadata: string;
      step3_script: {
        scenes: string[];
      };
      step4_generated_videos: {
        count: number;
        videos: Array<{
          video: {
            url: string;
          };
        }>;
      };
      step5_final_video: {
        url: string;
        note: string;
      };
    };
  };
  error?: string;
  details?: string;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Splitting video into clips",
    "Extracting metadata (audio, text, description)",
    "Generating AI script",
    "Creating videos for each scene",
    "Combining final video"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !tiktokUrl.trim()) {
      setError("Please fill in both fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);

    // Simulate step progression (since we can't get real-time updates from the API)
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 15000); // Update step every 15 seconds

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tiktokUrl: tiktokUrl.trim(),
          prompt: prompt.trim(),
        }),
      });

      const data = await response.json() as ProcessingResult;

      if (!response.ok) {
        throw new Error(data.error ?? `HTTP error! status: ${response.status}`);
      }

      clearInterval(stepInterval);
      setCurrentStep(steps.length);
      setResult(data);
    } catch (err) {
      clearInterval(stepInterval);
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPrompt("");
    setTiktokUrl("");
    setResult(null);
    setError(null);
    setCurrentStep(0);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 max-w-7xl">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem] mb-4">
            TikTok <span className="text-[hsl(280,100%,70%)]">AI</span> Studio
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Advanced AI-powered video transformation: Extract clips, analyze content, generate scripts, and create professional videos
          </p>
        </div>

        {!result && (
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="prompt" className="block text-lg font-medium text-gray-200">
                  Creative Vision
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your creative vision for the new video..."
                  className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] focus:border-transparent resize-none backdrop-blur-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tiktokUrl" className="block text-lg font-medium text-gray-200">
                  TikTok Video URL
                </label>
                <input
                  id="tiktokUrl"
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@username/video/..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)] focus:border-transparent backdrop-blur-sm"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(260,100%,60%)] hover:from-[hsl(280,100%,75%)] hover:to-[hsl(260,100%,65%)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing Video Pipeline...
                  </div>
                ) : (
                  "Start AI Video Processing"
                )}
              </button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="w-full max-w-5xl bg-white/10 backdrop-blur-sm rounded-xl p-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-center">AI Video Processing Pipeline</h3>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      index < currentStep
                        ? 'bg-green-500 border-green-500 text-white'
                        : index === currentStep
                        ? 'border-[hsl(280,100%,70%)] text-[hsl(280,100%,70%)]'
                        : 'border-gray-500 text-gray-500'
                    }`}>
                      {index < currentStep ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      ) : index === currentStep ? (
                        <div className="w-4 h-4 border-2 border-[hsl(280,100%,70%)] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className={`flex-1 ${
                      index < currentStep
                        ? 'text-green-400'
                        : index === currentStep
                        ? 'text-white font-medium'
                        : 'text-gray-500'
                    }`}>
                      Step {index + 1}: {step}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300">
                <p className="font-medium mb-2">Processing Timeline:</p>
                <ul className="space-y-1">
                  <li>• Video analysis and clip extraction: ~30-60 seconds</li>
                  <li>• Metadata extraction (transcription, text, description): ~1-3 minutes per clip</li>
                  <li>• AI script generation: ~30 seconds</li>
                  <li>• Video generation: ~2-5 minutes per scene</li>
                  <li>• Final video assembly: ~30 seconds</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {result && result.success && result.data && (
          <div className="w-full max-w-6xl space-y-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-3xl font-bold mb-6 text-center">🎬 Pipeline Complete!</h3>

              {/* Step 1 Results */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-[hsl(280,100%,70%)] mb-4">📹 Step 1: Video Clips ({result.data.pipeline.step1_clips.count} found)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.data.pipeline.step1_clips.clips.slice(0, 6).map((clip, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <video src={clip.url} controls className="w-full rounded-lg mb-2" />
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Time:</span> {clip.start_time}s - {clip.end_time}s</p>
                        <p><span className="font-medium">Score:</span> {(clip.score * 100).toFixed(1)}%</p>
                        {clip.transcription && (
                          <p><span className="font-medium">Audio:</span> {clip.transcription.substring(0, 50)}...</p>
                        )}
                        {clip.videoExplanation && (
                          <p><span className="font-medium">Visual:</span> {clip.videoExplanation.substring(0, 50)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3 Results */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-[hsl(280,100%,70%)] mb-4">📝 Step 3: AI Generated Script ({result.data.pipeline.step3_script.scenes.length} scenes)</h4>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="space-y-3">
                    {result.data.pipeline.step3_script.scenes.map((scene, index) => (
                      <div key={index} className="border-l-2 border-[hsl(280,100%,70%)] pl-4">
                        <p className="font-medium text-[hsl(280,100%,70%)]">Scene {index + 1}:</p>
                        <p className="text-gray-300">{scene}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4 Results */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-[hsl(280,100%,70%)] mb-4">🎥 Step 4: Generated Videos ({result.data.pipeline.step4_generated_videos.count} videos)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.data.pipeline.step4_generated_videos.videos.map((video, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <h5 className="font-medium mb-2">Generated Scene {index + 1}</h5>
                      <video src={video.video.url} controls className="w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5 Results */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-[hsl(280,100%,70%)] mb-4">🎞️ Step 5: Final Video</h4>
                <div className="bg-white/5 rounded-lg p-6">
                  {result.data.pipeline.step5_final_video.url ? (
                    <video src={result.data.pipeline.step5_final_video.url} controls className="w-full rounded-lg mb-4" />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">Video combination not yet implemented</p>
                      <p className="text-sm text-gray-500">Individual scene videos are available above</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-400">{result.data.pipeline.step5_final_video.note}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={resetForm}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all duration-200"
                >
                  Create Another Video
                </button>
              </div>
            </div>
          </div>
        )}

        {!result && !isLoading && (
          <div className="text-center text-gray-400 text-sm max-w-3xl space-y-4">
            <p>
              Our advanced AI pipeline analyzes TikTok videos, extracts meaningful content, and creates professional video content based on your creative vision.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
              {steps.map((step, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <div className="font-medium text-[hsl(280,100%,70%)] mb-1">Step {index + 1}</div>
                  <div>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
