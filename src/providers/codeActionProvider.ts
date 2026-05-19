import * as vscode from 'vscode';

export function registerCodeActions(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerCodeActionsProvider('*', {
        provideCodeActions(document, range, context, token) {
            const actions: vscode.CodeAction[] = [];
            
            const explain = new vscode.CodeAction('🤖 Explain this code', vscode.CodeActionKind.QuickFix);
            explain.command = { command: 'ai-debugger.explain', title: 'Explain' };
            actions.push(explain);
            
            const debug = new vscode.CodeAction('🐛 Debug this code', vscode.CodeActionKind.QuickFix);
            debug.command = { command: 'ai-debugger.debug', title: 'Debug' };
            actions.push(debug);
            
            const optimize = new vscode.CodeAction('⚡ Optimize this code', vscode.CodeActionKind.QuickFix);
            optimize.command = { command: 'ai-debugger.optimize', title: 'Optimize' };
            actions.push(optimize);
            
            return actions;
        }
    });
    
    context.subscriptions.push(provider);
    console.log('✅ CodeAction Provider Registered');
}