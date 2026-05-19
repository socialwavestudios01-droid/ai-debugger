import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CacheManager } from './cache';

export class GeminiClient {
    private genAI: GoogleGenerativeAI | null = null;
    private cache: CacheManager;
    
    constructor(cache: CacheManager) {
        this.cache = cache;
    }
    
    async call(prompt: string, code: string, title: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('ai-debugger');
        let apiKey = config.get<string>('apiKey');
        const modelName = config.get<string>('model') || 'gemini-2.5-flash-lite';
        
        if (!apiKey) {
            vscode.window.showErrorMessage('API Key missing!');
            return '';
        }
        
        const cacheKey = `${prompt}-${code}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
        
        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
        
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(`${prompt}\n\nCODE:\n${code}`);
        const response = result.response.text();
        
        this.cache.set(cacheKey, response);
        return response;
    }
}