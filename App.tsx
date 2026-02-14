
import React, { useState, useCallback } from 'react';
import { PromptInput } from './components/PromptInput';
import { PreviewCard } from './components/PreviewCard';
import { ExportModal } from './components/ExportModal';
import { FullScreenPreview } from './components/FullScreenPreview';
import { GithubIcon } from './components/icons/GithubIcon';
import { AnimatedBackground } from './components/AnimatedBackground';
import type { Version } from './types';
import { ExportFormat } from './types';
import { generateCodeForAllFormats } from './services/geminiService';

const promptSuggestions = [
  'A modern landing page for a new meditation app',
  'A portfolio website for a freelance photographer',
  'A pricing page for a SaaS product with three tiers',
  'An e-commerce product page for a stylish backpack',
];

const initialVersions: Version[] = [
  { id: 1, title: 'Minimal & Clean', prompt: '', code: '', status: 'idle', convertedCode: {}, progress: 0 },
  { id: 2, title: 'Bold Startup', prompt: '', code: '', status: 'idle', convertedCode: {}, progress: 0 },
  { id: 3, title: 'Creative & Modern', prompt: '', code: '', status: 'idle', convertedCode: {}, progress: 0 },
];

const styleModifiers: Record<string, string> = {
  'Minimal & Clean': 'with a minimal and clean design aesthetic. Emphasize whitespace, typography, and a simple, elegant color palette.',
  'Bold Startup': 'with a bold, modern design suitable for a tech startup. Use vibrant colors, strong typography, and clear calls-to-action.',
  'Creative & Modern': 'with a creative and artistic modern design. Feel free to use unconventional layouts, interesting color combinations, and unique visual elements.',
};


const App: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVersionForExport, setSelectedVersionForExport] = useState<Version | null>(null);
  const [selectedVersionForPreview, setSelectedVersionForPreview] = useState<Version | null>(null);

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    const versionsToGenerate = initialVersions.map(v => ({ 
      ...v, 
      prompt, 
      status: 'generating' as const, 
      code: '',
      convertedCode: {},
      progress: 0,
    }));
    setVersions(versionsToGenerate);

    const generationPromises = versionsToGenerate.map((version, index) => {
      const styleModifier = styleModifiers[version.title] || '';
      const augmentedPrompt = `${prompt} ${styleModifier}`;

      const onHtmlChunk = (chunk: string) => {
        setVersions(prev => {
          const newVersions = [...prev];
          if (newVersions[index] && newVersions[index].status === 'generating') {
            newVersions[index] = { 
              ...newVersions[index], 
              code: newVersions[index].code + chunk 
            };
          }
          return newVersions;
        });
      };
      
      const onProgressUpdate = (progress: number) => {
        setVersions(prev => {
          const newVersions = [...prev];
          const currentStatus = newVersions[index]?.status;
          if (newVersions[index] && (currentStatus === 'generating' || currentStatus === 'preview-ready')) {
            newVersions[index] = {
              ...newVersions[index],
              progress: progress,
            };
          }
          return newVersions;
        });
      };
      
      const onHtmlComplete = (fullHtml: string) => {
         setVersions(prev => {
          const newVersions = [...prev];
          if (newVersions[index] && newVersions[index].status === 'generating') {
            newVersions[index] = { 
              ...newVersions[index], 
              code: fullHtml,
              status: 'preview-ready',
            };
          }
          return newVersions;
        });
      };

      return generateCodeForAllFormats(augmentedPrompt, onHtmlChunk, onProgressUpdate, onHtmlComplete).then(allCode => {
        setVersions(prev => {
          const newVersions = [...prev];
          if (newVersions[index]) {
            newVersions[index] = {
              ...newVersions[index],
              status: 'completed',
              code: allCode.html, // Ensure final HTML is set
              progress: 100,
              convertedCode: {
                [ExportFormat.REACT]: allCode.react,
                [ExportFormat.VUE]: allCode.vue,
                [ExportFormat.SVELTE]: allCode.svelte,
              },
            };
          }
          return newVersions;
        });
      });
    });

    try {
      await Promise.all(generationPromises);
    } catch (error) {
      console.error("Generation failed:", error);
      setVersions(prev => prev.map(v => ({ ...v, status: 'error', progress: 0 })));
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-indigo-500/30 relative z-0">
      <AnimatedBackground />
      <header className="py-4 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800 relative z-10">
        <h1 className="text-xl font-bold text-slate-100">AI Webpage Generator</h1>
        <a 
          href="https://github.com/google/labs-prototypes" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="View on GitHub"
        >
          <GithubIcon className="h-6 w-6" />
        </a>
      </header>

      <main className="py-12 px-4 sm:px-8 relative z-10">
        <div className="container mx-auto">
          <PromptInput 
            onGenerate={handleGenerate} 
            isGenerating={isGenerating}
            suggestions={promptSuggestions}
          />

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {versions.map((version) => (
              <PreviewCard
                key={version.id}
                version={version}
                isGenerating={isGenerating}
                onSelect={() => setSelectedVersionForExport(version)}
                onFullScreen={() => setSelectedVersionForPreview(version)}
              />
            ))}
          </div>
        </div>
      </main>
      
      {selectedVersionForExport && (
        <ExportModal 
          version={selectedVersionForExport} 
          onClose={() => setSelectedVersionForExport(null)} 
        />
      )}
      
      {selectedVersionForPreview && (
        <FullScreenPreview 
          currentVersion={selectedVersionForPreview}
          versions={versions}
          onClose={() => setSelectedVersionForPreview(null)} 
          onVersionChange={setSelectedVersionForPreview}
        />
      )}
    </div>
  );
};

export default App;
