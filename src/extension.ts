// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const projectRoot = path.normalize(path.dirname(__filename)).replace(`${path.sep}dist`, "");

	const testDoc = fs.readFileSync(path.join(projectRoot, "src", "test", "test1.html")).toString();
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('accessibility-checker.helloWorld', () => {
		TraverseDocument(testDoc);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}


function TraverseDocument(document: string) {
	const $ = cheerio.load(document);
	//console.log($.html());
	console.log($("html").children()[2]);
	traverse($("html"));
	function traverse(element: cheerio.Cheerio<cheerio.Element>) {
		console.log(element.html());
		for(let child of element.children()) {
			traverse(child)
		}
	}
}
