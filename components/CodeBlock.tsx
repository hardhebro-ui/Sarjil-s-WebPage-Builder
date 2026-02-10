
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative h-full">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors text-slate-300 hover:text-white"
        aria-label="Copy code"
      >
        {isCopied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ClipboardIcon className="h-5 w-5" />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          height: '100%',
          width: '100%',
          margin: 0,
          padding: '1.5rem',
          backgroundColor: '#0f172a', /* slate-900 */
          fontSize: '0.875rem',
        }}
        codeTagProps={{
          style: {
            fontFamily: '"Fira Code", monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
