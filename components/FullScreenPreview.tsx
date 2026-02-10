
import React, { useEffect, useState } from 'react';
import type { Version } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { DesktopIcon } from './icons/DesktopIcon';
import { TabletIcon } from './icons/TabletIcon';
import { MobileIcon } from './icons/MobileIcon';

interface FullScreenPreviewProps {
  version: Version;
  onClose: () => void;
}

type Device = 'desktop' | 'tablet' | 'mobile';

const deviceDimensions: Record<Device, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '812px' },
};

export const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({ version, onClose }) => {
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');
  const [activeDevice, setActiveDevice] = useState<Device>('desktop');

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
          ${version.code}
        </body>
      </html>
    `;
    setIframeSrcDoc(htmlTemplate);
  }, [version.code]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      <header className="flex items-center p-4 border-b border-slate-700 bg-slate-800 flex-shrink-0">
        <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">{version.title}</h2>
        </div>
        <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-700 p-1 rounded-md">
                <button
                    onClick={() => setActiveDevice('desktop')}
                    className={`p-2 rounded-md transition-colors ${activeDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                    title="Desktop view"
                    aria-label="Desktop view"
                >
                    <DesktopIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => setActiveDevice('tablet')}
                    className={`p-2 rounded-md transition-colors ${activeDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                    title="Tablet view"
                    aria-label="Tablet view"
                >
                    <TabletIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => setActiveDevice('mobile')}
                    className={`p-2 rounded-md transition-colors ${activeDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                    title="Mobile view"
                    aria-label="Mobile view"
                >
                    <MobileIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
        <div className="flex-1 flex justify-end">
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <CloseIcon className="h-6 w-6" />
              <span className="sr-only">Close full screen preview</span>
            </button>
        </div>
      </header>
      <div className="flex-grow bg-slate-700/50 flex items-center justify-center p-4 sm:p-8 overflow-auto">
        <div 
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0"
          style={{ 
              width: deviceDimensions[activeDevice].width, 
              height: deviceDimensions[activeDevice].height, 
              maxWidth: '100%',
              maxHeight: '100%',
          }}
        >
          <iframe
            title={`${version.title} - ${activeDevice} view`}
            srcDoc={iframeSrcDoc}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
