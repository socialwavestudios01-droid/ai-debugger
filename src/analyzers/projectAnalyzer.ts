import * as vscode from 'vscode';

export function registerProjectAnalyzer(context: vscode.ExtensionContext) {
    const cmd = vscode.commands.registerCommand('ai-debugger.analyzeProject', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a project first!');
            return;
        }
        
        const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}', '**/node_modules/**');
        
        let totalLines = 0;
        let totalFunctions = 0;
        let totalClasses = 0;
        
        for (const file of files) {
            const doc = await vscode.workspace.openTextDocument(file);
            const text = doc.getText();
            totalLines += doc.lineCount;
            totalFunctions += (text.match(/function\s+\w+\s*\(/g) || []).length;
            totalClasses += (text.match(/class\s+\w+/g) || []).length;
        }
        
        vscode.window.showInformationMessage(
            `📁 ${files.length} files, ${totalLines} lines, ${totalFunctions} functions`
        );
    });
    
    context.subscriptions.push(cmd);
    console.log('✅ Project Analyzer Registered');
}