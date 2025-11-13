'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [quality, setQuality] = useState('standard');

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim()) {
      alert('Please enter both prompt and API key');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      // Use Z.AI CogView-4 API for image generation
      const response = await fetch('https://api.z.ai/api/paas/v4/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'cogview-4-250304',
          prompt: prompt,
          size: '1024x1024',
          quality: quality
        }),
      });

      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].url) {
        // Return image URL from Z.AI CogView-4
        setResult(data.data[0].url);
      } else {
        setResult('Failed to generate image: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      setResult('Error generating image. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          AI Image Studio Pro
        </h1>

        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Your Z.AI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Z.AI API key..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              Get your API key from <a href="https://z.ai" target="_blank" className="text-blue-500 hover:underline">Z.AI Platform</a>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Image Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="standard">Standard (5-10 seconds)</option>
              <option value="hd">HD Quality (20 seconds)</option>
            </select>
            <p className="text-xs text-gray-500">
              HD quality generates more detailed images but takes longer
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Image Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || !apiKey.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Generated Image:</h3>
              {result.startsWith('data:image') ? (
                <img
                  src={result}
                  alt="Generated image"
                  className="w-full rounded-md shadow-md"
                />
              ) : (
                <p className="text-gray-700">{result}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>AI Image Studio Pro - Generate images with Z.AI CogView-4</p>
          <p>High-quality bilingual (Chinese/English) image generation</p>
        </div>
      </div>
    </div>
  );
}