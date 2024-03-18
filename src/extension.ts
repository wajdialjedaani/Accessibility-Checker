import * as vscode from "vscode";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { Cheerio, Element, AnyNode, CheerioAPI } from "cheerio";
import { window, languages, TextDocument, DiagnosticCollection, workspace, Diagnostic } from "vscode";
import { isElement, Configuration, ConfigSchema, walk } from "./util";
import * as path from "path";
import {
  CheckHTMLTags,
  CheckLangRecognize,
  CheckImageTags,
  CheckATags,
  CheckAnchorText,
  CheckTitleTags,
  CheckTitleText,
  CheckTableTags,
  CheckOneH1Tag,
  CheckHeadingOrder,
  CheckVideoAndAudioTags,
  CheckButtons,
  CheckInput,
  CheckMultipleInputLabels,
  CheckInputAlt,
  CheckLabel,
  CheckID,
  CheckOnMouseOver,
  CheckOnMouseDown,
  CheckOnMouseLeave,
  CheckOnMouseOut,
  CheckSelectTag,
  CheckSelectTagLabels,
  //CheckFormTags,
  CheckTextAreaTags,
  CheckTextAreaTagLabels,
  CheckMarqueeTags,
  CheckForMetaTimeout,
  CheckForAcronym,
  CheckForApplet,
  CheckForBasefront,
  CheckForBig,
  CheckForBlink,
  CheckForCenter,
  CheckForDir,
  CheckForEmbed,
  CheckForFont,
  CheckForFrame,
  CheckForFrameset,
  CheckForIsIndex,
  CheckForMenu,
  CheckForNoFrames,
  CheckForPlaintext,
  CheckForS,
  CheckForStrike,
  CheckForTt,
  CheckForU,
  CheckForItalic,
  CheckForBold,
} from "./guidelineChecks";
import GenerateReportContent from "./generateView";

export function activate(context: vscode.ExtensionContext) {
  let config = new Configuration(context);

  //This collection will persist throughout life of extension
  const diagnostics = languages.createDiagnosticCollection("Test");
  const document = window.activeTextEditor?.document;
  const checkerStatusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000
  );

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
  checkerStatusBar.command = "accessibility-checker.generateReport";
  checkerStatusBar.text = "$(file) Generate Report";
  context.subscriptions.push(checkerStatusBar);
  checkerStatusBar.show();
  let dispo = vscode.commands.registerCommand("accessibility-checker.generateReport", () => {
    GenerateReport(context);
  });
  context.subscriptions.push(dispo);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      const document = window.activeTextEditor?.document;
      if (event.affectsConfiguration("accessibilityChecker") && document) {
        GenerateDiagnostics(document, diagnostics);
      }
    })
  );

  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((document) => diagnostics.delete(document.uri)));

  //Most likely going to remove this later
  let disposable = vscode.commands.registerCommand("accessibility-checker.ParseDocument", ParseDocument);
  context.subscriptions.push(disposable);
}

export function deactivate() {}

//Recurses through document, calling appropriate functions for each tag type. Adds diagnostics to a list and returns it.
function ParseDocument(document: string) {
  const guidelines = [
    CheckHTMLTags,
    CheckLangRecognize,
    CheckImageTags,
    CheckATags,
    CheckAnchorText,
    CheckTitleTags,
    CheckTitleText,
    CheckTableTags,
    CheckOneH1Tag,
    CheckHeadingOrder,
    CheckVideoAndAudioTags,
    CheckButtons,
    CheckInput,
    CheckMultipleInputLabels,
    CheckInputAlt,
    CheckLabel,
    CheckID,
    CheckOnMouseOver,
    CheckOnMouseDown,
    CheckOnMouseLeave,
    CheckOnMouseOut,
    CheckSelectTag,
    CheckSelectTagLabels,
    //CheckFormTags,
    CheckTextAreaTags,
    CheckTextAreaTagLabels,
    CheckMarqueeTags,
    CheckForMetaTimeout,
    CheckForAcronym,
    CheckForApplet,
    CheckForBasefront,
    CheckForBig,
    CheckForBlink,
    CheckForCenter,
    CheckForDir,
    CheckForEmbed,
    CheckForFont,
    CheckForFrame,
    CheckForFrameset,
    CheckForIsIndex,
    CheckForMenu,
    CheckForNoFrames,
    CheckForPlaintext,
    CheckForS,
    CheckForStrike,
    CheckForTt,
    CheckForU,
    CheckForItalic,
    CheckForBold,
  ];
  const $ = cheerio.load(document, { sourceCodeLocationInfo: true });
  let diagnostics: Diagnostic[] = []; //Overall list of diagnostics. Appended to each time an error is found
  traverse($.root());

  function traverse(node: Cheerio<AnyNode>) {
    node.contents().each(function (i, node) {
      if (!isElement(node)) return;
      //List of diagnostics pertaining to this node. We combine them all then add to the overall list
      let tempDiagnostics: Diagnostic[] = [];

      guidelines.forEach((func) => {
        tempDiagnostics = tempDiagnostics.concat(func($, node));
      });

      diagnostics = diagnostics.concat(tempDiagnostics);
      traverse($(node));
    });
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
  const newDiagnostics = ParseDocument(document.getText());
  diagnostics.set(document.uri, newDiagnostics);
}

function GenerateReport(context: vscode.ExtensionContext): void {
  if (!vscode.workspace.workspaceFolders) return;
  type FileDiagnostics = {
    title: string;
    path: string;
    diagnostics: Diagnostic[];
  };
  type FileStats = {
    title: string;
    path: string;
    statistics: Results;
  };

  const newDiagnostics: FileDiagnostics[] = [];
  let guidelines: string[] = [];
  let tallies: number[] = [0, 0, 0, 0];
  let amount: string[] = [];
  let messages: string[] = [];
  const results: FileStats[] = [];

  //User can hypothetically have multiple workspaces in one window
  for (const folder of vscode.workspace.workspaceFolders) {
    for (const file of walk(folder.uri.fsPath)) {
      //Push obj pairing a filepath with its list of diagnostics for use when we separate the data per file (like the PIT extension)
      const fileName = path.basename(file);
      newDiagnostics.push({
        title: fileName,
        path: file,
        diagnostics: [...ParseDocument(fs.readFileSync(file).toString())],
      });
    }
  }
  //Get the data for each file. Current dirty solution is to just merge the results as we go, but this should be improved.
  for (const file of newDiagnostics) {
    const tempResults = getTallies(file.diagnostics);
    results.push({
      title: file.title,
      path: file.path,
      statistics: {
        guidelines: tempResults.guidelines,
        tallies: tempResults.tallies,
        amount: tempResults.amntStrg,
        messages: tempResults.messages,
      },
    });
    //This is the merging of data. Ignore this when judging the code
    for (const guideline of tempResults.guidelines) {
      if (guidelines.includes(guideline)) {
        amount[guidelines.indexOf(guideline)] = (
          Number(amount[guidelines.indexOf(guideline)]) +
          Number(tempResults.amntStrg[tempResults.guidelines.indexOf(guideline)])
        ).toString();
      } else {
        guidelines.push(guideline);
        amount.push(tempResults.amntStrg[tempResults.guidelines.indexOf(guideline)]);
      }
    }
    tallies = tallies.map((val, i) => val + tempResults.tallies[i]);
    messages.push(...tempResults.messages);
  }
  //I casted it to a set to remove duplicates, but then the length doesn't match guidelines... fix this later
  messages = [...new Set(messages)].slice(0, guidelines.length);

  window.showInformationMessage("Generating Report...");
  // Create a webview panel
  const panel = vscode.window.createWebviewPanel("dataVisualization", "Data Visualization", vscode.ViewColumn.One, {
    enableScripts: true,
    retainContextWhenHidden: true,
  });

  //VSCode restricts access to files. Get the file paths and convert those to webview URIs instead to access them inside of the HTML.
  const stylesPath = vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.css");
  const scriptsPath = vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.js");
  const viewPath = vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.html");

  //This function will read the html file at viewPath. That will have <script> and <link> tags that will read from
  //scriptsPath and stylesPath respectively.
  const htmlContent = GenerateReportContent({
    stylesPath: panel.webview.asWebviewUri(stylesPath),
    scriptsPath: panel.webview.asWebviewUri(scriptsPath),
    viewPath: viewPath.fsPath,
  });

  // Set the HTML content then send the data, triggering our scripts to run
  panel.webview.html = htmlContent;
  panel.webview.postMessage({ guidelines, tallies, amount, messages, results });
}

function getTallies(diagnostics: Diagnostic[]) {
  let tallies: number[] = [0, 0, 0, 0];
  let guideAmounts: [[string, number]] = [["", 0]];
  let guidelines: string[] = [];
  let amount: number[] = [];
  let amntStrg: string[] = [];
  let messages: string[] = [];
  let storage: string[] = [];

  sortDiagnostics(diagnostics);

  diagnostics.forEach((func) => {
    if (func.code) {
      if (func.code.toString().at(0) === "1") {
        tallies[0] += 1;
      } else if (func.code.toString().at(0) === "2") {
        tallies[1] += 1;
      } else if (func.code.toString().at(0) === "3") {
        tallies[2] += 1;
      } else if (func.code.toString().at(0) === "4") {
        tallies[3] += 1;
      }

      if (guidelines.includes(func.code.toString())) {
        amount[guidelines.indexOf(func.code.toString())] += 1;
      } else {
        guidelines.push(func.code.toString());
        messages.push(func.message);
        amount.push(1);
      }
    }
  });

  amount.forEach((func) => {
    amntStrg.push(func.toString());
  });
  return { guidelines, tallies, amntStrg, messages };
}

type Results = {
  guidelines: string[];
  tallies: number[];
  amount: string[];
  messages: string[];
};

function sortDiagnostics(diagnostics: Diagnostic[]) {
  diagnostics.sort((one, two) => {
    if (one && two && one.code !== undefined && two.code != undefined) {
      return one.code < two.code ? -1 : 1;
    } else {
      throw new Error("one or two is undefined or their code is undefined.");
    }
  });
}
