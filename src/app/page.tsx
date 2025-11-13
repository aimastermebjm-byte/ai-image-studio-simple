'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [quality, setQuality] = useState('standard');
  const [canRequest, setCanRequest] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

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
      // Add longer delay to prevent rapid requests
      await new Promise(resolve => setTimeout(resolve, 3000));

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

      if (response.status === 429) {
        const data = await response.json();
        const businessCode = data.error?.code;
        let errorMessage = 'Rate limit exceeded. ';

        if (businessCode === '1302') {
          errorMessage += 'High concurrency usage. CogView-4 has limit of 5 requests. Please wait 60 seconds.';
        } else if (businessCode === '1303') {
          errorMessage += 'High frequency usage. Please wait 60 seconds before trying again.';
        } else if (businessCode === '1304') {
          errorMessage += 'Daily call limit reached. Please try again tomorrow.';
          setCooldownSeconds(3600); // 1 hour for daily limit
        } else if (businessCode === '1308') {
          errorMessage += 'Usage limit reached. Please wait before trying again.';
        } else if (businessCode === '1309') {
          errorMessage += 'GLM Coding Plan expired. Please renew at https://z.ai/subscribe';
        } else {
          errorMessage += 'CogView-4 has concurrency limit of 5 requests. Please wait 60 seconds.';
        }

        setResult(errorMessage);
        // Start countdown timer
        const cooldownTime = businessCode === '1304' ? 3600 : 60;
        setCooldownSeconds(cooldownTime);
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

      if (response.status === 401) {
        const data = await response.json();
        const businessCode = data.error?.code;
        let errorMessage = 'Authentication error. ';

        if (businessCode === '1002') {
          errorMessage += 'Authorization Token is invalid. Please check your API key.';
        } else if (businessCode === '1003') {
          errorMessage += 'Authorization Token expired. Please get a new API key.';
        } else if (businessCode === '1113') {
          errorMessage += 'Account is in arrears. Please recharge at https://z.ai/subscribe';
        } else {
          errorMessage += 'Invalid API key. Please check your Z.AI API key.';
        }

        setResult(errorMessage);
        setCanRequest(true); // Allow retry with correct API key
        return;
      }

      if (response.status === 400) {
        const data = await response.json();
        const businessCode = data.error?.code;
        let errorMessage = 'Parameter error. ';

        if (businessCode === '1214') {
          errorMessage += data.error.message || 'Invalid parameter provided.';
        } else {
          errorMessage += 'Please check your input parameters.';
        }

        setResult(errorMessage);
        setCanRequest(true); // Allow retry for parameter errors
        return;
      }

      if (!response.ok) {
        setResult(`API Error: ${response.status} - ${response.statusText}`);
        setCanRequest(true); // Allow retry for other errors
        return;
      }

      const data = await response.json();

      // Check for business errors even with 200 status
      if (data.error) {
        const businessCode = data.error.code;
        let errorMessage = '';

        if (businessCode === '1301') {
          errorMessage = 'Content blocked: System detected potentially unsafe or sensitive content. Please modify your prompt.';
        } else if (businessCode === '1300') {
          errorMessage = 'API call blocked by policy. Please try a different approach.';
        } else {
          errorMessage = `Error: ${data.error.message}`;
        }

        setResult(errorMessage);
        setCanRequest(true); // Allow retry for content policy errors
        return;
      }

      if (data.data && data.data[0] && data.data[0].url) {
        // Return image URL from Z.AI CogView-4
        setResult(data.data[0].url);
        // Add 15 second delay after successful generation to prevent rate limit
        setCooldownSeconds(15);
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
      } else {
        setResult('Failed to generate image: ' + (data.error?.message || 'No image URL in response'));
        setCanRequest(true); // Allow retry for failed generation
      }
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
          <p>AI Image Studio Pro - Generate images with Z.AI CogView-4</p>
          <p>High-quality bilingual (Chinese/English) image generation</p>
          <p className="mt-2 text-xs">⚡ 15 second cooldown between generations to prevent rate limits</p>
          <p className="text-xs">Concurrency limit: 5 requests for CogView-4-250304</p>
        </div>
      </div>
    </div>
  );
}