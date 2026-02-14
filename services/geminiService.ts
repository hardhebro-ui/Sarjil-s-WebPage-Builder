
import { GoogleGenAI } from "@google/genai";
import { ExportFormat } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getHtmlSystemInstruction = () => `You are an expert web developer specializing in Tailwind CSS. Your task is to generate a single, complete HTML file based on the user's prompt.

RULES:
- The HTML file must be self-contained.
- Use Tailwind CSS for all styling. Include the Tailwind CDN script in the <head>: <script src="https://cdn.tailwindcss.com"></script>.
- Use modern and aesthetically pleasing design principles.
- Ensure the generated webpage is responsive.
- Do NOT include any explanations, comments, or markdown formatting (e.g., \`\`\`html) in your response. Only output the raw HTML code.
- Populate the page with relevant, high-quality placeholder text and images (using services like unsplash or placeholder.com).
- The HTML should be ONLY the content for the <body> tag. Do not include <html>, <head>, or <body> tags in your output.
`;

const getComponentPrompt = (prompt: string, format: ExportFormat) => {
    const formatMap = {
        [ExportFormat.REACT]: 'React (using JSX and functional components)',
        [ExportFormat.VUE]: 'Vue.js (using Single-File Components)',
        [ExportFormat.SVELTE]: 'Svelte',
    };
    const targetLanguage = formatMap[format];

    return `You are an expert web developer. Create a single self-contained ${targetLanguage} component file using Tailwind CSS based on the following description: "${prompt}".

    RULES:
    - The component must be self-contained in a single code block.
    - For React, use functional components and hooks. Convert 'class' attributes to 'className'.
    - For Vue, create a <template>, <script setup>, and <style> block as needed.
    - For Svelte, create a <script>, markup, and <style> block as needed.
    - Do NOT include any explanations, comments, or markdown formatting (e.g., \`\`\`javascript, \`\`\`jsx, etc.) in your response. Only output the raw code for the component file.
    - Populate the component with relevant, high-quality placeholder text and images (using services like unsplash or placeholder.com).
    `;
};

export async function generateCodeForAllFormats(
    prompt: string, 
    onHtmlChunk: (chunk: string) => void,
    onProgressUpdate: (progress: number) => void,
    onHtmlComplete: (fullHtml: string) => void
): Promise<{ html: string; react: string; vue: string; svelte: string; }> {
    
    onProgressUpdate(10);

    const htmlStreamPromise = (async () => {
        const response = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: getHtmlSystemInstruction(),
            },
        });

        let fullHtml = '';
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                fullHtml += text;
                onHtmlChunk(text);
            }
        }
        onHtmlComplete(fullHtml); // Signal that HTML is done
        return fullHtml;
    })();

    const generateComponent = async (format: ExportFormat) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: getComponentPrompt(prompt, format),
        });
        const text = response.text;
        if (!text) {
            throw new Error(`Failed to generate ${format} code: empty response from API.`);
        }
        return text.trim();
    }
    
    // Wait for HTML to be ready before starting component generation,
    // to ensure the 'preview-ready' state is handled cleanly.
    const htmlCode = await htmlStreamPromise;
    onProgressUpdate(25);

    const reactCode = await generateComponent(ExportFormat.REACT);
    onProgressUpdate(50);

    const vueCode = await generateComponent(ExportFormat.VUE);
    onProgressUpdate(75);

    const svelteCode = await generateComponent(ExportFormat.SVELTE);
    onProgressUpdate(100);
    
    return {
        html: htmlCode,
        react: reactCode,
        vue: vueCode,
        svelte: svelteCode,
    };
}