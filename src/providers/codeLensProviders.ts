import * as vscode from 'vscode';

class AICodeLensProvider implements vscode.CodeLensProvider {
    async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const lenses: vscode.CodeLens[] = [];
        const text = document.getText();
        
        const patterns = [
            /function\s+(\w+)\s*\(/g,
            /class\s+(\w+)/g,
            /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
            /def\s+(\w+)\s*\(/g
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const range = new vscode.Range(startPos, startPos);
                const lens = new vscode.CodeLens(range, {
                    title: '🤖 AI Analyze',
                    command: 'ai-debugger.explain'
                });
                lenses.push(lens);
            }
        }
        
        return lenses;
    }
}

export function registerCodeLens(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerCodeLensProvider('*', new AICodeLensProvider());
    context.subscriptions.push(provider);
    console.log('✅ CodeLens Provider Registered');
}