
import React, { useState, useEffect, useCallback } from 'react';
import type { Version } from '../types';
import { ExportFormat } from '../types';
import { convertCode } from '../services/geminiService';
import { CodeBlock } from './CodeBlock';
import { CloseIcon } from './icons/CloseIcon';
import { HtmlIcon } from './icons/HtmlIcon';
import { ReactIcon } from './icons/ReactIcon';
import { VueIcon } from './icons/VueIcon';
import { SvelteIcon } from './icons/SvelteIcon';
import { LoadingSpinnerIcon } from './icons/LoadingSpinnerIcon';

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
  
  // FIX: Replaced reduce with a more type-safe filter and fromEntries to avoid potential type inference issues.
  const initialConvertedCode = Object.fromEntries(
    Object.entries(version.convertedCode || {}).filter(([, value]) => value !== null)
  );

  const [convertedCode, setConvertedCode] = useState<Record<string, string>>({
    [ExportFormat.HTML]: version.code,
    ...initialConvertedCode,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormatChange = useCallback(async (format: ExportFormat) => {
    setActiveFormat(format);
    if (convertedCode[format] || format === ExportFormat.HTML) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await convertCode(version.code, format);
      setConvertedCode(prev => ({ ...prev, [format]: result }));
    } catch (e) {
      console.error("Conversion failed", e);
      setError('Failed to convert code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [version.code, convertedCode]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const currentCode = convertedCode[activeFormat] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-[90vw] h-[90vh] max-w-6xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Export Code - {version.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        
        <div className="flex flex-col md:flex-row flex-grow min-h-0">
          <aside className="w-full md:w-48 p-4 border-b md:border-b-0 md:border-r border-slate-700 flex-shrink-0">
            <nav className="flex md:flex-col gap-2">
              {formatOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleFormatChange(id)}
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
            {isLoading ? (
               <div className="h-full flex flex-col items-center justify-center p-4">
                <LoadingSpinnerIcon className="animate-spin h-8 w-8 text-white mb-4" />
                <p className="text-slate-300 text-center">Converting to {activeFormat.charAt(0).toUpperCase() + activeFormat.slice(1)}...</p>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-red-400">{error}</div>
            ) : (
              <CodeBlock code={currentCode} language={activeFormat === 'html' ? 'html' : 'javascript'} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
