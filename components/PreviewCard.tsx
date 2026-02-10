
import React, { useEffect, useState } from 'react';
import type { Version } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { CheckIcon } from './icons/CheckIcon';
import { ExpandIcon } from './icons/ExpandIcon';
import { DesignPlaceholderIcon } from './icons/DesignPlaceholderIcon';
import { LoadingSpinnerIcon } from './icons/LoadingSpinnerIcon';

interface PreviewCardProps {
  version: Version;
  onSelect: () => void;
  isGenerating: boolean;
  onFullScreen: () => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({ version, onSelect, onFullScreen }) => {
  const debouncedCode = useDebounce(version.code, 300);
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');

  useEffect(() => {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${debouncedCode}
        </body>
      </html>
    `;
    setIframeSrcDoc(htmlTemplate);
  }, [debouncedCode]);

  const renderStatusOverlay = () => {
    if (version.status === 'idle') {
      return (
        <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center p-4 text-center">
          <DesignPlaceholderIcon className="h-16 w-16 text-slate-600 mb-4" />
          <h4 className="font-semibold text-slate-300">Awaiting Your Ideas</h4>
          <p className="text-sm text-slate-400">Your generated design will appear here.</p>
        </div>
      );
    }
    if (version.status === 'generating' && !version.code) {
      return (
        <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center p-4">
          <LoadingSpinnerIcon className="animate-spin h-12 w-12 text-indigo-500" />
          <p className="text-slate-300 text-center mt-4">Generating preview...</p>
        </div>
      );
    }
     if (version.status === 'error') {
      return (
        <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center p-4">
          <p className="text-red-400 text-center">Generation failed. Please try again.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col shadow-lg transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-500/50">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <h3 className="font-bold text-slate-100">{version.title}</h3>
        <button
          onClick={onFullScreen}
          disabled={version.status !== 'completed'}
          className="text-slate-400 hover:text-white transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
          aria-label="View in full screen"
          title="View in full screen"
        >
          <ExpandIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-grow relative aspect-[4/3] bg-white">
        {renderStatusOverlay()}
        <iframe
          title={version.title}
          srcDoc={iframeSrcDoc}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
        />
      </div>
      <div className="p-4 bg-slate-800/50">
        <button
          onClick={onSelect}
          disabled={version.status !== 'completed'}
          className="w-full bg-slate-700 text-white font-semibold rounded-md px-4 py-2 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors flex items-center justify-center"
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Select this version
        </button>
      </div>
    </div>
  );
};
