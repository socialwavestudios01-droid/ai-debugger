export class CacheManager {
    private cache = new Map<string, { data: string, timestamp: number }>();
    private duration: number = 300; // 5 minutes
    
    constructor() {
        const config = vscode.workspace.getConfiguration('ai-debugger');
        this.duration = config.get<number>('cacheDuration') || 300;
    }
    
    get(key: string): string | null {
        const entry = this.cache.get(key);
        if (entry && (Date.now() - entry.timestamp) < this.duration * 1000) {
            return entry.data;
        }
        return null;
    }
    
    set(key: string, data: string): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    
    clear(): void {
        this.cache.clear();
    }
}