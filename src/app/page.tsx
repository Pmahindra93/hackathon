'use client';

import { useState, useEffect } from 'react';

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

interface TransformationResult {
  finalVideoUrl: string;
  era: TimeEra;
  processingTime: number;
  voiceDetails: {
    voiceName: string;
    transformedText: string;
    emotionalTone: string;
  };
  originalDialogue: string;
  effects: string[];
}

export default function TikTokTimeMachine() {
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedEra, setSelectedEra] = useState('');
  const [availableEras, setAvailableEras] = useState<TimeEra[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState('');

  // Fetch available eras on component mount
  useEffect(() => {
    void fetchAvailableEras();
  }, []);

    const fetchAvailableEras = async () => {
    try {
      const response = await fetch('/api/process');
      const data = await response.json() as { success?: boolean; eras?: TimeEra[] };

      if (data.success && data.eras) {
        setAvailableEras(data.eras);
        if (data.eras.length > 0 && data.eras[0]) {
          setSelectedEra(data.eras[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch eras:', error);
    }
  };

  const handleTransform = async () => {
    if (!videoUrl || !selectedEra) {
      setError('Please provide a video URL and select an era');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult(null);
    setCurrentStep('Starting transformation...');

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          eraId: selectedEra,
        }),
      });

      const data = await response.json() as { success?: boolean; result?: TransformationResult; error?: string };

      if (data.success && data.result) {
        setResult(data.result);
        setCurrentStep('Transformation completed!');
      } else {
        setError(data.error ?? 'Transformation failed');
      }
    } catch (error) {
      console.error('Transformation error:', error);
      setError('Failed to transform video. Please try again.');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const selectedEraData = availableEras.find(era => era.id === selectedEra);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            🎭 TikTok Time Machine
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your videos into different historical eras with AI-powered voice, visuals, and music
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">✨ Create Your Transformation</h2>

              {/* Video URL Input */}
              <div className="mb-6">
                <label className="block text-white mb-2 font-medium">
                  📹 Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/your-video.mp4"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isProcessing}
                />
              </div>

              {/* Era Selection */}
              <div className="mb-8">
                <label className="block text-white mb-4 font-medium">
                  🕰️ Choose Your Era
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {availableEras.map((era) => (
                    <button
                      key={era.id}
                      onClick={() => setSelectedEra(era.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedEra === era.id
                          ? 'border-purple-400 bg-purple-400/20 text-white'
                          : 'border-white/30 bg-white/10 text-gray-300 hover:border-purple-400/60'
                      }`}
                      disabled={isProcessing}
                    >
                      <div className="font-bold text-lg">{era.displayName}</div>
                      <div className="text-sm opacity-80 mt-1">
                        {era.scriptStyle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Era Preview */}
              {selectedEraData && (
                <div className="mb-8 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                  <h3 className="text-white font-bold mb-2">🎨 Era Preview</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><span className="text-purple-300">Style:</span> {selectedEraData.style}</p>
                    <p><span className="text-purple-300">Audio:</span> {selectedEraData.audioStyle}</p>
                    <p><span className="text-purple-300">Effects:</span> {selectedEraData.visualEffects.join(', ')}</p>
                  </div>
                </div>
              )}

              {/* Transform Button */}
              <button
                onClick={handleTransform}
                disabled={isProcessing || !videoUrl || !selectedEra}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Transforming...
                  </div>
                ) : (
                  '🚀 Transform Video'
                )}
              </button>

              {/* Processing Status */}
              {isProcessing && currentStep && (
                <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <p className="text-blue-300 text-sm">⏳ {currentStep}</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                  <p className="text-red-300 text-sm">❌ {error}</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">🎬 Transformation Results</h2>

              {result ? (
                <div className="space-y-6">
                  {/* Final Video */}
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-400/30">
                    <h3 className="text-white font-bold mb-4 text-xl">✨ Your Transformed Video</h3>
                    <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                      <video
                        src={result.finalVideoUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNkI3Mjg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WaWRlbzwvdGV4dD4KPC9zdmc+"
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                    <div className="flex space-x-3">
                      <a
                        href={result.finalVideoUrl}
                        download="transformed-video.mp4"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-center transition-all"
                      >
                        💾 Download
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.finalVideoUrl)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
                      >
                        📋 Copy Link
                      </button>
                    </div>
                  </div>

                  {/* Transformation Details */}
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-purple-300 font-bold mb-2">🎭 Era: {result.era.displayName}</h4>
                      <p className="text-gray-300 text-sm">{result.era.style}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-blue-300 font-bold mb-2">🎙️ Voice: {result.voiceDetails.voiceName}</h4>
                      <p className="text-gray-300 text-sm mb-2">
                        <span className="font-medium">Tone:</span> {result.voiceDetails.emotionalTone}
                      </p>
                                             <p className="text-gray-300 text-sm">
                         <span className="font-medium">Transformed Text:</span> &ldquo;{result.voiceDetails.transformedText}&rdquo;
                       </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-yellow-300 font-bold mb-2">⚡ Processing Time</h4>
                      <p className="text-gray-300 text-sm">
                        {Math.round(result.processingTime / 1000)} seconds
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-pink-300 font-bold mb-2">✨ Applied Effects</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.effects.map((effect, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm"
                          >
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎬</div>
                  <p className="text-gray-400">
                    {isProcessing ?
                      "Your video is being transformed through time..." :
                      "Your transformed video will appear here"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-white font-bold mb-2">Era-Specific Voice</h3>
            <p className="text-gray-400 text-sm">
              AI-generated voices that match each historical period with authentic accents and speech patterns
            </p>
          </div>
          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-white font-bold mb-2">Visual Style Transfer</h3>
            <p className="text-gray-400 text-sm">
              Transform visuals with era-appropriate backgrounds, filters, and artistic styles
            </p>
          </div>
          <div className="text-center p-6 bg-white/5 rounded-xl">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-white font-bold mb-2">Period Music</h3>
            <p className="text-gray-400 text-sm">
              AI-generated background music that captures the authentic sound of each era
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
