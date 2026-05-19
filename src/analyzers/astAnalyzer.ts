import * as vscode from 'vscode';

export function registerASTAnalyzer(context: vscode.ExtensionContext) {
    const cmd = vscode.commands.registerCommand('ai-debugger.analyzeAST', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file open!');
            return;
        }
        
        const text = editor.document.getText();
        const lines = text.split('\n');
        
        const analysis = {
            lines: lines.length,
            functions: (text.match(/function\s+\w+\s*\(/g) || []).length,
            classes: (text.match(/class\s+\w+/g) || []).length,
            comments: lines.filter(l => l.trim().startsWith('//')).length,
            imports: (text.match(/import\s+.*from/g) || []).length
        };
        
        vscode.window.showInformationMessage(
            `📊 ${analysis.functions} functions, ${analysis.classes} classes, ${analysis.comments} comments`
        );
    });
    
    context.subscriptions.push(cmd);
    console.log('✅ AST Analyzer Registered');
}