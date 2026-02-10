
import { GoogleGenAI } from "@google/genai";
import { ExportFormat } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are an expert web developer specializing in Tailwind CSS. Your task is to generate a single, complete HTML file based on the user's prompt.

RULES:
- The HTML file must be self-contained.
- Use Tailwind CSS for all styling. Include the Tailwind CDN script in the <head>: <script src="https://cdn.tailwindcss.com"></script>.
- Use modern and aesthetically pleasing design principles.
- Ensure the generated webpage is responsive.
- Do NOT include any explanations, comments, or markdown formatting (e.g., \`\`\`html) in your response. Only output the raw HTML code.
- Populate the page with relevant, high-quality placeholder text and images (using services like unsplash or placeholder.com).
- The HTML should be ONLY the content for the <body> tag. Do not include <html>, <head>, or <body> tags in your output.
`;

export async function* generateInitialCodeStream(prompt: string) {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            systemInstruction,
        },
    });

    for await (const chunk of response) {
        yield chunk.text;
    }
}

export async function convertCode(code: string, format: ExportFormat): Promise<string> {
    const formatMap = {
        [ExportFormat.REACT]: 'React (using JSX and functional components)',
        [ExportFormat.VUE]: 'Vue.js (using Single-File Components)',
        [ExportFormat.SVELTE]: 'Svelte',
    }
    
    const targetLanguage = formatMap[format];

    if (!targetLanguage || format === ExportFormat.HTML) {
        return code;
    }

    const conversionPrompt = `Convert the following HTML code with Tailwind CSS into a single file ${targetLanguage} component.

    RULES:
    - The component must be self-contained in a single code block.
    - For React, use functional components and hooks. Convert 'class' attributes to 'className'.
    - For Vue, create a <template>, <script setup>, and <style> block as needed.
    - For Svelte, create a <script>, markup, and <style> block as needed.
    - Do NOT include any explanations, comments, or markdown formatting (e.g., \`\`\`javascript or \`\`\`jsx) in your response. Only output the raw code for the component file.
    
    HTML to convert:
    \`\`\`html
    ${code}
    \`\`\`
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro for better code conversion quality
        contents: conversionPrompt
    });

    const text = response.text;
    if (!text) {
        throw new Error('Failed to convert code: empty response from API.');
    }
    return text.trim();
}
