'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('AIzaSyDwqr_Ayx05UVQZExxCaq1PVBU8OzHvFss');
  const [model, setModel] = useState('gemini'); // gemini, openai, huggingface
  const [quality, setQuality] = useState('standard');
  const [canRequest, setCanRequest] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [apiTestResult, setApiTestResult] = useState('');

  const testApiKey = async () => {
    if (model === 'huggingface') {
      setApiTestResult('✅ HuggingFace uses free public models - no API key needed!');
      return;
    }

    if (!apiKey.trim()) {
      setApiTestResult('Please enter API key first');
      return;
    }

    try {
      let response;
      if (model === 'gemini') {
        // Test Gemini API with text generation
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello, test message' }] }]
          }),
        });
      } else if (model === 'openai') {
        response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': 'Bearer ' + apiKey,
          },
        });
      } else {
        setApiTestResult('❌ API not implemented for testing');
        return;
      }

      if (response.ok) {
        setApiTestResult(`✅ ${model.toUpperCase()} API Key is valid and has access`);
      } else {
        const data = await response.json();
        setApiTestResult(`❌ ${model.toUpperCase()} API Key test failed: ${data.error?.message || 'Invalid key'}`);
      }
    } catch (error) {
      setApiTestResult(`❌ Network error: ${error.message}`);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (model !== 'huggingface' && !apiKey.trim()) {
      alert('Please enter API key');
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

      if (model === 'gemini') {
        // Use Google Gemini Imagen API
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
              temperature: 0.4,
              seed: Math.floor(Math.random() * 1000000)
            }
          }),
        });

        if (response.status === 429) {
          setResult('Gemini rate limit exceeded. Please wait 60 seconds before trying again.');
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
          setResult(`Gemini Error: ${errorData.error?.message || 'API request failed'}`);
          setCanRequest(true);
          return;
        }

        data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts) {
          const imagePart = data.candidates[0].content.parts.find(part => part.inlineData);
          if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
            setResult(`data:image/png;base64,${imagePart.inlineData.data}`);
            setCooldownSeconds(5);
          } else {
            setResult('No image generated. Please try a different prompt.');
            setCanRequest(true);
          }
        } else {
          setResult('Failed to generate image with Gemini Imagen 3.0');
          setCanRequest(true);
          return;
        }

      } else if (model === 'openai') {
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
          setResult('OpenAI rate limit exceeded. Please wait 60 seconds before trying again.');
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
        setResult(`${model.toUpperCase()} API not implemented yet.`);
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
              <option value="gemini">Google Gemini Imagen (Free)</option>
              <option value="openai">OpenAI DALL-E 3 (Paid)</option>
              <option value="huggingface">HuggingFace (Free - Coming Soon)</option>
            </select>
            <p className="text-xs text-gray-500">
              Google Gemini offers free image generation with Imagen 3.0
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {model === 'huggingface' ? 'No API Key Needed' : `Your ${model === 'gemini' ? 'Google Gemini' : model === 'openai' ? 'OpenAI' : 'Z.AI'} API Key`}
            </label>
            {model !== 'huggingface' && (
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${model === 'gemini' ? 'Google Gemini' : model === 'openai' ? 'OpenAI' : 'Z.AI'} API key...`}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            <div className="flex gap-2">
              {model !== 'huggingface' && (
                <button
                  type="button"
                  onClick={testApiKey}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Test API Key
                </button>
              )}
              {model === 'gemini' && (
                <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-xs text-blue-500 hover:underline">
                  Get Gemini API Key
                </a>
              )}
              {model === 'openai' && (
                <a href="https://platform.openai.com/api-keys" target="_blank" className="text-xs text-blue-500 hover:underline">
                  Get OpenAI API Key
                </a>
              )}
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
            disabled={loading || !prompt.trim() || (model !== 'huggingface' && !apiKey.trim()) || !canRequest}
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
          <p>Free image generation with Google Gemini Imagen 3.0</p>
          <p className="mt-2 text-xs">⚡ 5 second cooldown between generations to prevent rate limits</p>
          <p className="text-xs">Get your free Gemini API key and start generating images!</p>
        </div>
      </div>
    </div>
  );
}