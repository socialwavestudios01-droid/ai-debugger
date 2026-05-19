import * as vscode from 'vscode';

let metricsBar: vscode.StatusBarItem;

export function registerCodeMetrics(context: vscode.ExtensionContext) {
    const updateMetrics = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const text = editor.document.getText();
        const lines = text.split('\n');
        
        const functions = (text.match(/function\s+\w+\s*\(/g) || []).length;
        const classes = (text.match(/class\s+\w+/g) || []).length;
        const comments = lines.filter(l => l.trim().startsWith('//')).length;
        
        if (!metricsBar) {
            metricsBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
            context.subscriptions.push(metricsBar);
        }
        
        metricsBar.text = `$(graph) ${functions} fn | ${classes} cls | ${comments} 💬`;
        metricsBar.show();
    };
    
    vscode.window.onDidChangeActiveTextEditor(updateMetrics);
    vscode.workspace.onDidChangeTextDocument(updateMetrics);
    updateMetrics();
    
    console.log('✅ Code Metrics Registered');
}