import * as vscode from "vscode";
import * as cheerio from "cheerio";
import { Cheerio, Element, AnyNode, CheerioAPI } from "cheerio";
import { window, languages, TextDocument, DiagnosticCollection, workspace, Diagnostic } from "vscode";
import { isElement } from "./util";
import { CheckHTMLTags, CheckImageTags, CheckATags, /*CheckTableTags*/ } from "./guidelineChecks";

export function activate(context: vscode.ExtensionContext) {
  //This collection will persist throughout life of extension
  const diagnostics = languages.createDiagnosticCollection("Test");
  const document = window.activeTextEditor?.document;

  //Run check once on startup and then listen for document changes for future checks
  if (document) {
    GenerateDiagnostics(document, diagnostics);
  }

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        GenerateDiagnostics(editor.document, diagnostics);
      }
    })
  );
  context.subscriptions.push(
    workspace.onDidChangeTextDocument((editor) => {
      GenerateDiagnostics(editor.document, diagnostics);
    })
  );

  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((document) => diagnostics.delete(document.uri)));

  //Most likely going to remove this later
  let disposable = vscode.commands.registerCommand("accessibility-checker.ParseDocument", ParseDocument);
  context.subscriptions.push(disposable);
}

export function deactivate() {}

//Recurses through document, calling appropriate functions for each tag type. Adds diagnostics to a list and returns it.
function ParseDocument(document: TextDocument) {
  let containsTitle = 0;
  const text = document.getText();
  const $ = cheerio.load(text, { sourceCodeLocationInfo: true });
  let diagnostics: Diagnostic[] = []; //Overall list of diagnostics. Appended to each time an error is found
  traverse($.root());

  function traverse(node: Cheerio<AnyNode>) {
    node.contents().each(function (i, node) {
      if (!isElement(node)) return;
      //List of diagnostics pertaining to this node. We combine them all then add to the overall list
      let tempDiagnostics: Diagnostic[] = [];
      if (node.name === "html") {
        tempDiagnostics = tempDiagnostics.concat(CheckHTMLTags($, node));
      } else if (node.name === "img") {
        tempDiagnostics = tempDiagnostics.concat(CheckImageTags($, node));
      } else if (node.name === "a") {
        tempDiagnostics = tempDiagnostics.concat(CheckATags($, node));
      } else if (node.name === "title") {
        containsTitle = 1;
      } else if (node.name === "table") {
        //Not sure how to handle this one
      }
      diagnostics = diagnostics.concat(tempDiagnostics);
      traverse($(node));
    });
  }
  if(containsTitle === 0){
    window.showErrorMessage("Document needs title");
  }
  return diagnostics;
}

//Called by VSCode on every document change/edit. We modify the provided collection with a new set of diagnostics.
//Could potentially become resource intensive, consider checking what changes occur and only checking tags in that area?
function GenerateDiagnostics(document: TextDocument, diagnostics: DiagnosticCollection): void {
  if (!languages.match({ language: "html" }, document)) {
    vscode.window.showErrorMessage("Document is not HTML");
    return;
  }
  const newDiagnostics = ParseDocument(document);
  console.log(newDiagnostics);
  diagnostics.set(document.uri, newDiagnostics);
}
