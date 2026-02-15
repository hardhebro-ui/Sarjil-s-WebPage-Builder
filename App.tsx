
import React, { useState, useCallback, useRef } from 'react';
import { PromptInput } from './components/PromptInput';
import { PreviewCard } from './components/PreviewCard';
import { ExportModal } from './components/ExportModal';
import { FullScreenPreview } from './components/FullScreenPreview';
import { GithubIcon } from './components/icons/GithubIcon';
import { AnimatedBackground } from './components/AnimatedBackground';
import { DesignPlaceholderIcon } from './components/icons/DesignPlaceholderIcon';
import type { Version } from './types';
import { ExportFormat } from './types';
import { generateHtmlStream, generateComponentCode } from './services/geminiService';

const promptSuggestions = [
  'A modern landing page for a new meditation app',
  'A portfolio website for a freelance photographer',
  'A pricing page for a SaaS product with three tiers',
  'An e-commerce product page for a stylish backpack',
];

const STYLE_TEMPLATES: Omit<Version, 'prompt' | 'code' | 'status' | 'convertedCode'>[] = [
  { id: 1, title: 'Minimal & Clean' },
  { id: 2, title: 'Bold Startup' },
  { id: 3, title: 'Creative & Modern' },
];

const styleModifiers: Record<string, string> = {
  'Minimal & Clean': 'with a minimal and clean design aesthetic. Emphasize whitespace, typography, and a simple, elegant color palette.',
  'Bold Startup': 'with a bold, modern design suitable for a tech startup. Use vibrant colors, strong typography, and clear calls-to-action.',
  'Creative & Modern': 'with a creative and artistic modern design. Feel free to use unconventional layouts, interesting color combinations, and unique visual elements.',
};

const App: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVersionIdForExport, setSelectedVersionIdForExport] = useState<number | null>(null);
  const [selectedVersionIdForPreview, setSelectedVersionIdForPreview] = useState<number | null>(null);
  const generationCancelled = useRef(false);

  const selectedVersionForExport = versions.find(v => v.id === selectedVersionIdForExport) || null;
  const selectedVersionForPreview = versions.find(v => v.id === selectedVersionIdForPreview) || null;

  const handleCancel = () => {
    generationCancelled.current = true;
    setIsGenerating(false);
    setVersions([]);
  };

  const handleGenerate = useCallback(async (prompt: string, selectedFormats: ExportFormat[]) => {
    generationCancelled.current = false;
    setIsGenerating(true);

    const versionsToGenerate = STYLE_TEMPLATES.map(template => ({
      ...template,
      prompt,
      status: 'generating' as const,
      code: '',
      convertedCode: selectedFormats
        .filter(f => f !== ExportFormat.HTML)
        .reduce((acc, format) => {
          acc[format] = null; // null indicates "generating"
          return acc;
        }, {} as Partial<Record<ExportFormat, string | null>>),
    }));
    setVersions(versionsToGenerate);

    const allPromises = versionsToGenerate.flatMap((version, index) => {
        const styleModifier = styleModifiers[version.title] || '';
        const augmentedPrompt = `${prompt} ${styleModifier}`;

        const htmlPromise = generateHtmlStream(augmentedPrompt, (chunk) => {
            if (generationCancelled.current) return;
            setVersions(prev => {
                const newVersions = [...prev];
                if (newVersions[index]?.status === 'generating') {
                    newVersions[index] = { ...newVersions[index], code: newVersions[index].code + chunk };
                }
                return newVersions;
            });
        }).then(fullHtml => {
            if (generationCancelled.current) return;
            setVersions(prev => {
                const newVersions = [...prev];
                if (newVersions[index]) {
                    newVersions[index] = { ...newVersions[index], status: 'preview-ready', code: fullHtml };
                }
                return newVersions;
            });
        });

        const componentPromises = (Object.keys(version.convertedCode || {}) as ExportFormat[])
            .map(format => 
                generateComponentCode(augmentedPrompt, format)
                    .then(generatedCode => {
                        if (generationCancelled.current) return;
                        setVersions(prev => prev.map(v => v.id === version.id ? { ...v, convertedCode: { ...v.convertedCode, [format]: generatedCode } } : v));
                    })
                    .catch(err => {
                        console.error(`Failed to generate ${format} for ${version.title}`, err);
                        if (generationCancelled.current) return;
                        setVersions(prev => prev.map(v => v.id === version.id ? { ...v, convertedCode: { ...v.convertedCode, [format]: `// Error generating code. Please try again.` } } : v));
                    })
            );

        return [htmlPromise, ...componentPromises];
    });

    try {
        await Promise.all(allPromises);
    } catch (error) {
        if (generationCancelled.current) { setVersions([]); return; };
        console.error("Generation failed:", error);
        setVersions(prev => prev.map(v => ({ ...v, status: 'error' })));
    } finally {
        if (!generationCancelled.current) {
            setIsGenerating(false);
        }
    }
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-indigo-500/30 relative z-0">
      <AnimatedBackground />
      <header className="py-4 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800 relative z-10">
        <h1 className="text-xl font-bold text-slate-100">AI Webpage Generator</h1>
        <a 
          href="https://github.com/hardhebro-ui/Sarjil-s-WebPage-Builder" 
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
            onCancel={handleCancel}
          />

          {versions.length > 0 ? (
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {versions.map((version) => (
                <PreviewCard
                  key={version.id}
                  version={version}
                  isGenerating={isGenerating}
                  onSelect={() => setSelectedVersionIdForExport(version.id)}
                  onFullScreen={() => setSelectedVersionIdForPreview(version.id)}
                />
              ))}
            </div>
          ) : (
             <div className="mt-16 text-center border-2 border-dashed border-slate-700 rounded-lg p-12 max-w-4xl mx-auto">
              <DesignPlaceholderIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-300">Your generated designs will appear here</h3>
              <p className="text-slate-500 mt-2">Enter a description and select your desired code formats to get started.</p>
            </div>
          )}
        </div>
      </main>
      
      {selectedVersionForExport && (
        <ExportModal 
          version={selectedVersionForExport} 
          onClose={() => setSelectedVersionIdForExport(null)} 
        />
      )}
      
      {selectedVersionForPreview && (
        <FullScreenPreview 
          currentVersion={selectedVersionForPreview}
          versions={versions.filter(v => v.status === 'preview-ready')}
          onClose={() => setSelectedVersionIdForPreview(null)} 
          onVersionChange={(newVersion) => setSelectedVersionIdForPreview(newVersion.id)}
        />
      )}
    </div>
  );
};

export default App;
