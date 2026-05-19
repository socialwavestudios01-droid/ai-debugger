import * as vscode from 'vscode';

export function registerHoverProvider(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
            
            if (word && word.length > 2 && word.length < 30) {
                const markdown = new vscode.MarkdownString(
                    `**🤖 AI Debugger**\n\n**${word}**\n\n[Explain](command:ai-debugger.explain) | [Debug](command:ai-debugger.debug) | [Optimize](command:ai-debugger.optimize)`
                );
                markdown.isTrusted = true;
                return new vscode.Hover(markdown);
            }
            return null;
        }
    });
    
    context.subscriptions.push(provider);
    console.log('✅ Hover Provider Registered');
}