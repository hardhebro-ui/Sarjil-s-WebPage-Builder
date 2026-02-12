
import React, { useState, useEffect } from 'react';
import type { Version } from '../types';
import { ExportFormat } from '../types';
import { generateZip } from '../services/zipService';
import { CodeBlock } from './CodeBlock';
import { CloseIcon } from './icons/CloseIcon';
import { HtmlIcon } from './icons/HtmlIcon';
import { ReactIcon } from './icons/ReactIcon';
import { VueIcon } from './icons/VueIcon';
import { SvelteIcon } from './icons/SvelteIcon';
import { LoadingSpinnerIcon } from './icons/LoadingSpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ExportModalProps {
  version: Version;
  onClose: () => void;
}

const formatOptions = [
  { id: ExportFormat.HTML, label: 'HTML', icon: HtmlIcon },
  { id: ExportFormat.REACT, label: 'React', icon: ReactIcon },
  { id: ExportFormat.VUE, label: 'Vue', icon: VueIcon },
  { id: ExportFormat.SVELTE, label: 'Svelte', icon: SvelteIcon },
];

export const ExportModal: React.FC<ExportModalProps> = ({ version, onClose }) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>(ExportFormat.HTML);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const codeForFormat = {
    [ExportFormat.HTML]: version.code,
    ...(version.convertedCode || {}),
  };

  const currentCode = codeForFormat[activeFormat] || '';

  const handleDownload = async () => {
    if (!currentCode) return;
    setIsDownloading(true);
    try {
        const cleanTitle = version.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        await generateZip(currentCode, activeFormat, cleanTitle);
    } catch (err) {
        console.error("Failed to generate zip", err);
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-[90vw] h-[90vh] max-w-6xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Export Code - {version.title}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading || !currentCode}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-indigo-400 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
            >
              {isDownloading ? (
                  <LoadingSpinnerIcon className="animate-spin h-5 w-5" />
              ) : (
                  <DownloadIcon className="h-5 w-5" />
              )}
              {isDownloading ? 'Zipping...' : 'Download ZIP'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </header>
        
        <div className="flex flex-col md:flex-row flex-grow min-h-0">
          <aside className="w-full md:w-48 p-4 border-b md:border-b-0 md:border-r border-slate-700 flex-shrink-0">
            <nav className="flex md:flex-col gap-2">
              {formatOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveFormat(id)}
                  className={`w-full flex items-center p-2 rounded-md text-sm font-medium transition-colors ${
                    activeFormat === id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-grow p-1 overflow-auto bg-slate-900">
            {currentCode ? (
              <CodeBlock code={currentCode} language={activeFormat === 'html' ? 'html' : 'javascript'} />
            ) : (
               <div className="h-full flex flex-col items-center justify-center p-4">
                <LoadingSpinnerIcon className="animate-spin h-8 w-8 text-white mb-4" />
                <p className="text-slate-300 text-center">Loading code...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
