
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { LoadingSpinnerIcon } from './icons/LoadingSpinnerIcon';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  suggestions: string[];
}

export const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isGenerating, suggestions }) => {
  const [prompt, setPrompt] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-4 tracking-tight">
        Describe the webpage you want to create
      </h2>
      <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
        Enter a detailed description, and our AI will generate three unique designs for you in real-time.
      </p>
      <div className="max-w-3xl mx-auto relative" ref={containerRef}>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., a landing page for a SaaS product that sells AI-powered widgets"
              className="flex-grow bg-slate-800 border border-slate-700 text-white rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow w-full"
              disabled={isGenerating}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-md px-6 py-3 disabled:bg-indigo-400 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all duration-200 transform hover:scale-105"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate
                </>
              )}
            </button>
          </div>
        </form>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10 text-left overflow-hidden">
            <p className="px-4 py-2 text-xs text-slate-400 font-semibold tracking-wider uppercase">Suggestions</p>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
