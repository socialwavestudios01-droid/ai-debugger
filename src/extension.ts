import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 AI Debugger Pro Activated with ALL Features!');
    
    // ========== DIAGNOSTICS COLLECTION (Real-time error detection) ==========
    diagnosticCollection = vscode.languages.createDiagnosticCollection('ai-debugger');
    context.subscriptions.push(diagnosticCollection);
    
    // Real-time error checking on code changes
    let debounceTimeout: NodeJS.Timeout;
    vscode.workspace.onDidChangeTextDocument(event => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const document = event.document;
            if (['javascript', 'typescript', 'python', 'java', 'cpp', 'c'].includes(document.languageId)) {
                checkCodeForErrors(document);
            }
        }, 1000);
    });
    
    // Initial check for open documents
    vscode.workspace.textDocuments.forEach(doc => {
        if (['javascript', 'typescript', 'python', 'java', 'cpp', 'c'].includes(doc.languageId)) {
            checkCodeForErrors(doc);
        }
    });
    
    // ========== STATUS BAR ==========
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = "$(sparkle) AI Pro";
    statusBar.tooltip = "AI Debugger Pro - All Features Active";
    statusBar.show();
    context.subscriptions.push(statusBar);
    
    // ========== HOVER PROVIDER (Code pe mouse leke jane par) ==========
    const hoverProvider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
            
            if (word && word.length > 2 && word.length < 40) {
                const markdown = new vscode.MarkdownString(
                    `**🤖 AI Debugger Pro**\n\n` +
                    `**\`${word}\`**\n\n` +
                    `---\n` +
                    `[📖 Explain](command:ai-debugger.explain) | ` +
                    `[🐛 Debug](command:ai-debugger.debug) | ` +
                    `[⚡ Optimize](command:ai-debugger.optimize)\n\n` +
                    `*Hover and click to use AI*`
                );
                markdown.isTrusted = true;
                return new vscode.Hover(markdown);
            }
            return null;
        }
    });
    context.subscriptions.push(hoverProvider);
    
    // ========== CODE LENS PROVIDER (Function ke upar button) ==========
    class AICodeLensProvider implements vscode.CodeLensProvider {
        async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
            const lenses: vscode.CodeLens[] = [];
            const text = document.getText();
            
            const patterns = [
                /function\s+(\w+)\s*\(/g,
                /class\s+(\w+)/g,
                /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
                /def\s+(\w+)\s*\(/g,
                /async\s+function\s+(\w+)/g
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
    
    const codeLensProvider = vscode.languages.registerCodeLensProvider('*', new AICodeLensProvider());
    context.subscriptions.push(codeLensProvider);
    
    // ========== CODE ACTION PROVIDER (Lightbulb 💡 suggestions) ==========
    const codeActionProvider = vscode.languages.registerCodeActionsProvider('*', {
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
            
            const analyze = new vscode.CodeAction('📊 Analyze structure', vscode.CodeActionKind.QuickFix);
            analyze.command = { command: 'ai-debugger.analyzeAST', title: 'Analyze' };
            actions.push(analyze);
            
            return actions;
        }
    });
    context.subscriptions.push(codeActionProvider);
    
    // ========== CODE METRICS (Status bar mein stats) ==========
    let metricsBar: vscode.StatusBarItem;
    const updateMetrics = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const text = editor.document.getText();
        const lines = text.split('\n');
        
        const functions = (text.match(/function\s+\w+\s*\(/g) || []).length;
        const classes = (text.match(/class\s+\w+/g) || []).length;
        const comments = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*')).length;
        
        if (!metricsBar) {
            metricsBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
            context.subscriptions.push(metricsBar);
        }
        
        metricsBar.text = `$(graph) ${functions} fn | ${classes} cls | ${comments} 💬`;
        metricsBar.tooltip = `Lines: ${lines.length}`;
        metricsBar.show();
    };
    
    vscode.window.onDidChangeActiveTextEditor(updateMetrics);
    vscode.workspace.onDidChangeTextDocument(updateMetrics);
    updateMetrics();
    
    // ========== SET API KEY COMMAND ==========
    const setKeyCmd = vscode.commands.registerCommand('ai-debugger.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Google Gemini API Key (FREE from aistudio.google.com)',
            password: true,
            placeHolder: 'AIza...'
        });
        
        if (apiKey) {
            await vscode.workspace.getConfiguration().update('ai-debugger.apiKey', apiKey, true);
            genAI = new GoogleGenerativeAI(apiKey);
            vscode.window.showInformationMessage('✅ API Key saved! All AI features are ready!');
        }
    });
    context.subscriptions.push(setKeyCmd);
    
    // ========== EXPLAIN COMMAND ==========
    const explainCmd = vscode.commands.registerCommand('ai-debugger.explain', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file open!');
            return;
        }
        
        const code = editor.document.getText(editor.selection);
        if (!code) {
            vscode.window.showWarningMessage('Select some code first!');
            return;
        }
        
        await callGemini(code, 'Explain this code in simple terms:', '📖 Code Explanation');
    });
    context.subscriptions.push(explainCmd);
    
    // ========== DEBUG COMMAND ==========
    const debugCmd = vscode.commands.registerCommand('ai-debugger.debug', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file open!');
            return;
        }
        
        const code = editor.document.getText(editor.selection);
        if (!code) {
            vscode.window.showWarningMessage('Select some code first!');
            return;
        }
        
        await callGemini(code, 'Find bugs in this code. List issues and suggest fixes:', '🐛 Bug Analysis');
    });
    context.subscriptions.push(debugCmd);
    
    // ========== OPTIMIZE COMMAND ==========
    const optimizeCmd = vscode.commands.registerCommand('ai-debugger.optimize', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No file open!');
            return;
        }
        
        const code = editor.document.getText(editor.selection);
        if (!code) {
            vscode.window.showWarningMessage('Select some code first!');
            return;
        }
        
        await callGemini(code, 'Optimize this code for better performance and readability:', '⚡ Code Optimization');
    });
    context.subscriptions.push(optimizeCmd);
    
    // ========== ANALYZE STRUCTURE COMMAND ==========
    const analyzeCmd = vscode.commands.registerCommand('ai-debugger.analyzeAST', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const text = editor.document.getText();
        const lines = text.split('\n');
        
        const stats = {
            lines: lines.length,
            functions: (text.match(/function\s+\w+\s*\(/g) || []).length,
            classes: (text.match(/class\s+\w+/g) || []).length,
            comments: lines.filter(l => l.trim().startsWith('//')).length,
            imports: (text.match(/import\s+.*from/g) || []).length
        };
        
        const message = `📊 ${stats.functions} functions, ${stats.classes} classes, ${stats.comments} comments, ${stats.imports} imports`;
        vscode.window.showInformationMessage(message);
        
        // Also show in panel
        showResultPanel(
            `📊 **Code Statistics**\n\n- Lines: ${stats.lines}\n- Functions: ${stats.functions}\n- Classes: ${stats.classes}\n- Comments: ${stats.comments}\n- Imports: ${stats.imports}`,
            'Code Structure'
        );
    });
    context.subscriptions.push(analyzeCmd);
    
    // ========== CLEAR CACHE COMMAND ==========
    const clearCacheCmd = vscode.commands.registerCommand('ai-debugger.clearCache', () => {
        vscode.window.showInformationMessage('🗑️ Cache cleared (if implemented)');
    });
    context.subscriptions.push(clearCacheCmd);
    
    // ========== PROJECT ANALYZE COMMAND ==========
    const projectCmd = vscode.commands.registerCommand('ai-debugger.analyzeProject', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showWarningMessage('Open a project folder first!');
            return;
        }
        
        const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx,py,java}', '**/node_modules/**');
        vscode.window.showInformationMessage(`📁 Found ${files.length} files in project`);
    });
    context.subscriptions.push(projectCmd);
    
    // Check for existing API key
    checkApiKey();
    
    vscode.window.showInformationMessage('🤖 AI Debugger Pro - ALL Features Active! Hover over code, check lightbulb 💡, see Code Lens!');
}

// ========== REAL-TIME ERROR CHECKING FUNCTION ==========
async function checkCodeForErrors(document: vscode.TextDocument) {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Missing semicolon warning (JS/TS)
        if ((document.languageId === 'javascript' || document.languageId === 'typescript') && 
            line.includes('console.log') && !line.includes(';') && !line.trim().endsWith(';')) {
            const range = new vscode.Range(i, 0, i, line.length);
            diagnostics.push({
                severity: vscode.DiagnosticSeverity.Warning,
                range: range,
                message: '⚠️ Missing semicolon',
                source: 'AI Debugger',
                code: 'missing-semicolon'
            });
        }
        
        // TODO/FIXME detection
        if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('fixme')) {
            const range = new vscode.Range(i, 0, i, line.length);
            diagnostics.push({
                severity: vscode.DiagnosticSeverity.Information,
                range: range,
                message: `📝 ${line.trim()}`,
                source: 'AI Debugger',
                code: 'task-reminder'
            });
        }
        
        // Console.log warning (remove in production)
        if (line.includes('console.log') && !line.includes('//')) {
            const range = new vscode.Range(i, line.indexOf('console.log'), i, line.indexOf('console.log') + 11);
            diagnostics.push({
                severity: vscode.DiagnosticSeverity.Information,
                range: range,
                message: '💡 Remove console.log in production',
                source: 'AI Debugger',
                code: 'console-log'
            });
        }
    }
    
    diagnosticCollection.set(document.uri, diagnostics);
}

// ========== REAL AI CALL FUNCTION ==========
async function callGemini(code: string, prompt: string, title: string) {
    const config = vscode.workspace.getConfiguration('ai-debugger');
    let apiKey = config.get<string>('apiKey');
    const modelName = config.get<string>('model') || 'gemini-2.5-flash-lite';
    
    if (!apiKey) {
        const action = await vscode.window.showErrorMessage(
            '🔑 API Key missing! Get FREE key from Google AI Studio',
            'Set API Key'
        );
        if (action === 'Set API Key') {
            await vscode.commands.executeCommand('ai-debugger.setApiKey');
        }
        return;
    }
    
    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `🤖 AI is analyzing...`,
        cancellable: false
    }, async () => {
        try {
            const model = genAI!.getGenerativeModel({ model: modelName });
            const fullPrompt = `${prompt}\n\nAnswer in 2-3 short sentences. Be concise.\n\nCODE:\n${code}`;
            const result = await model.generateContent(fullPrompt);
            const response = result.response.text();
            
            showResultPanel(response, title);
            
        } catch (error: any) {
            let errorMsg = error.message || 'Unknown error';
            if (errorMsg.includes('429')) {
                errorMsg = 'Daily free limit reached. Try tomorrow or use different model';
            } else if (errorMsg.includes('403')) {
                errorMsg = 'Invalid API Key. Get free key from https://aistudio.google.com/app/apikey';
            }
            vscode.window.showErrorMessage(`AI Error: ${errorMsg}`);
        }
    });
}

// ========== SHOW RESULT PANEL ==========
function showResultPanel(content: string, title: string) {
    const panel = vscode.window.createWebviewPanel(
        'aiResult',
        `🤖 ${title}`,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );
    
    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background-color: #1e1e1e;
                    color: #d4d4d4;
                }
                h1 { color: #0db7ed; font-size: 18px; }
                .badge {
                    background-color: #0db7ed;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    display: inline-block;
                    margin-bottom: 10px;
                }
                pre {
                    background-color: #2d2d2d;
                    padding: 15px;
                    border-radius: 8px;
                    overflow-x: auto;
                    white-space: pre-wrap;
                    font-family: 'Consolas', monospace;
                    font-size: 14px;
                }
                button {
                    background-color: #0db7ed;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 10px;
                }
                button:hover { background-color: #0a8bb3; }
            </style>
        </head>
        <body>
            <div class="badge">✨ AI Debugger Pro ✨</div>
            <h1>🤖 ${title}</h1>
            <button onclick="copyToClipboard()">📋 Copy</button>
            <pre id="content">${escapeHtml(content)}</pre>
            <script>
                function copyToClipboard() {
                    const content = document.getElementById('content').innerText;
                    navigator.clipboard.writeText(content);
                    alert('Copied to clipboard!');
                }
            </script>
        </body>
        </html>
    `;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function checkApiKey() {
    const config = vscode.workspace.getConfiguration('ai-debugger');
    const apiKey = config.get<string>('apiKey');
    
    if (!apiKey) {
        const action = await vscode.window.showInformationMessage(
            '🔑 AI Debugger Pro: Set your FREE Gemini API key to unlock all features',
            'Set API Key'
        );
        if (action === 'Set API Key') {
            vscode.commands.executeCommand('ai-debugger.setApiKey');
        }
    } else {
        genAI = new GoogleGenerativeAI(apiKey);
        vscode.window.showInformationMessage('🤖 AI Debugger Pro - Hover, Code Lens, Lightbulb, and AI all active!');
    }
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.clear();
    }
    console.log('AI Debugger Pro Deactivated');
}