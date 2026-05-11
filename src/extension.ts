import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('line-cloner.cloneLineBelow', async (n: number) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;

        const selections = [...editor.selections].sort((a, b) => b.start.line - a.start.line);
        const newSelections: vscode.Selection[] = [];

        await editor.edit(editBuilder => {
            selections.forEach(selection => {
                const line = selection.start.line;
                const lineText = document.lineAt(line).text;

                const indentMatch = lineText.match(/^\s*/);
                const indent = indentMatch ? indentMatch[0] : '';

                const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

                if (n === 0) {
                    let targetLine = line + 1;
                    while (targetLine < document.lineCount && !document.lineAt(targetLine).isEmptyOrWhitespace) {
                        targetLine++;
                    }

                    let insertPosition: vscode.Position;

                    if (targetLine >= document.lineCount) {
                        insertPosition = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
                        editBuilder.insert(insertPosition, eol + lineText);
                    } else {
                        insertPosition = new vscode.Position(targetLine, 0);
                        editBuilder.insert(insertPosition, lineText);
                    }

                    const newPos = new vscode.Position(selection.active.line, selection.active.character);
                    newSelections.push(new vscode.Selection(newPos, newPos));
                    return;
                }

                let textToInsert = eol;
                for (let i = 1; i < n; i++) {
                    textToInsert += indent + eol;
                }
                textToInsert += lineText;

                const insertPosition = new vscode.Position(line, document.lineAt(line).text.length);
                editBuilder.insert(insertPosition, textToInsert);

                const newPos = new vscode.Position(selection.active.line, selection.active.character);
                newSelections.push(new vscode.Selection(newPos, newPos));
            });
        });

        editor.selections = newSelections;
        editor.revealRange(newSelections[0]);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }