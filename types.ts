
export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

export interface Version {
  id: number;
  title: string;
  prompt: string;
  code: string;
  status: GenerationStatus;
  convertedCode?: Partial<Record<ExportFormat, string | null>>;
}

export enum ExportFormat {
  HTML = 'html',
  REACT = 'react',
  VUE = 'vue',
  SVELTE = 'svelte',
}
