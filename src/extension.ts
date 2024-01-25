// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import { Cheerio, Element, AnyNode } from "cheerio";
import * as guideline from "./guidelines/guidelines";

let activeEditor = vscode.window.activeTextEditor;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const projectRoot = path
    .normalize(path.dirname(__filename))
    .replace(`${path.sep}dist`, "");

  const testDoc = fs
    .readFileSync(path.join(projectRoot, "src", "test", "test1.html"))
    .toString();
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "accessibility-checker.helloWorld",
    () => {
      TraverseDocument(testDoc);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function highlight(element: Cheerio<AnyNode>){

}

function TraverseDocument(document: string) {
  const $ = cheerio.load(document);
  //console.log($.html());
  //console.log($.root().children());
  console.log($.root().toArray());
  //console.log($("html"));
  traverse($.root());
  function traverse(element: Cheerio<AnyNode>) {
    element.contents().each(function (i, element) {
      if (this.nodeType === NodeType.TEXT_NODE) {
        console.log("text");
      } else if (this.nodeType === NodeType.ELEMENT_NODE) {
        console.log($(this).attr());
        traverse($(this));
      }
    });
    //for (const child of element.children()) {
    //  console.log(child);
    //}
  }
}

enum NodeType {
  TEXT_NODE = 3,
  ELEMENT_NODE = 1,
}
