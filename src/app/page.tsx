'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai'); // openai, stability, replicate
  const [quality, setQuality] = useState('standard');
  const [canRequest, setCanRequest] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [apiTestResult, setApiTestResult] = useState('');

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setApiTestResult('Please enter API key first');
      return;
    }

    try {
      const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'test' }]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setApiTestResult('✅ API Key is valid and has text generation access');
      } else {
        const data = await response.json();
        setApiTestResult(`❌ API Key test failed: ${data.error?.message || 'Invalid key'}`);
      }
    } catch (error) {
      setApiTestResult(`❌ Network error: ${error.message}`);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim()) {
      alert('Please enter both prompt and API key');
      return;
    }

    if (!canRequest) {
      alert('Please wait before making another request');
      return;
    }

    setLoading(true);
    setResult('');
    setCanRequest(false);

    try {
      // Add delay to prevent rapid requests
      await new Promise(resolve => setTimeout(resolve, 2000));

      let response;
      let data;

      if (model === 'openai') {
        // Use OpenAI DALL-E 3 API
        response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: quality
          }),
        });

        if (response.status === 429) {
          setResult('Rate limit exceeded. Please wait 60 seconds before trying again.');
          setCooldownSeconds(60);
          const countdown = setInterval(() => {
            setCooldownSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(countdown);
                setCanRequest(true);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          setResult(`OpenAI Error: ${errorData.error?.message || 'API request failed'}`);
          setCanRequest(true);
          return;
        }

        data = await response.json();
        if (data.data && data.data[0] && data.data[0].url) {
          setResult(data.data[0].url);
          setCooldownSeconds(10);
        } else {
          setResult('Failed to generate image with OpenAI DALL-E 3');
          setCanRequest(true);
          return;
        }

      } else {
        // Fallback to other APIs or error
        setResult(`${model.toUpperCase()} API not implemented yet. Please use OpenAI.`);
        setCanRequest(true);
        return;
      }

      // Start countdown timer after successful generation
      const countdown = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setCanRequest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setResult('Error generating image. Please check your API key.');
      setCanRequest(true); // Allow retry for network errors
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
              AI Model Provider
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openai">OpenAI DALL-E 3 (Recommended)</option>
              <option value="zai" disabled>Z.AI CogView-4 (Not Working)</option>
            </select>
            <p className="text-xs text-gray-500">
              OpenAI provides reliable image generation with consistent results
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Your {model === 'openai' ? 'OpenAI' : 'Z.AI'} API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${model === 'openai' ? 'OpenAI' : 'Z.AI'} API key...`}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={testApiKey}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Test API Key
              </button>
              <a
                href={model === 'openai' ? 'https://platform.openai.com/api-keys' : 'https://z.ai'}
                target="_blank"
                className="text-xs text-blue-500 hover:underline"
              >
                Get {model === 'openai' ? 'OpenAI' : 'Z.AI'} API key
              </a>
            </div>
            {apiTestResult && (
              <p className="text-xs p-2 rounded bg-gray-50" style={{ color: apiTestResult.includes('✅') ? '#059669' : '#dc2626' }}>
                {apiTestResult}
              </p>
            )}
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
              <option value="standard">Standard (8-12 seconds)</option>
              <option value="hd">HD Quality (20-25 seconds)</option>
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
            disabled={loading || !prompt.trim() || !apiKey.trim() || !canRequest}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : (!canRequest ? `Please wait... (${cooldownSeconds}s)` : 'Generate Image')}
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
          <p>AI Image Studio Pro - Generate images with multiple AI models</p>
          <p>Professional image generation with OpenAI DALL-E 3 and more</p>
          <p className="mt-2 text-xs">⚡ 10 second cooldown between generations to prevent rate limits</p>
          <p className="text-xs">Using your own API key - pay only for what you use</p>
        </div>
      </div>
    </div>
  );
}