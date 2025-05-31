"use client";

import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !tiktokUrl.trim()) {
      alert("Please fill in both fields");
      return;
    }

    setIsLoading(true);
    // TODO: Add your processing logic here
    console.log("Prompt:", prompt);
    console.log("TikTok URL:", tiktokUrl);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem] mb-4">
            TikTok <span className="text-[hsl(280,100%,70%)]">AI</span> Tool
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Transform TikTok videos with AI-powered prompts
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-lg font-medium text-gray-200">
                AI Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your AI prompt here..."
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(260,100%,60%)] hover:from-[hsl(280,100%,75%)] hover:to-[hsl(260,100%,65%)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Process Video"
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-gray-400 text-sm max-w-lg">
          <p>
            Upload your TikTok video URL and provide an AI prompt to transform and analyze your content.
            Ensure your URL is valid and accessible.
          </p>
        </div>
      </div>
    </main>
  );
}
