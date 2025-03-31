import * as vscode from "vscode";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { window, languages, TextDocument, DiagnosticCollection, Diagnostic } from "vscode";
import { isElement, Configuration, walk, WebviewMessageSchema } from "./util";
import { GuidelineList } from "./guidelineChecks";
import GenerateReportContent from "./generateView";
import { FileDiagnostics, FileStats, Results } from "./types";

export function activate(context: vscode.ExtensionContext) {
  new Configuration(context); //Init the config object for the rest of the lifetime of the extension

  //This collection will persist throughout life of extension
  const diagnostics = languages.createDiagnosticCollection("Test");
  const document = window.activeTextEditor?.document;

  //Run check once on startup and then listen for document changes for future checks
  if (document) {
    GenerateDiagnostics(document, diagnostics);
  }

  const ParseOnConfigUpdateDispose = vscode.workspace.onDidChangeConfiguration((event) => {
    const document = window.activeTextEditor?.document;
    if (event.affectsConfiguration("accessibilityChecker") && document) {
      GenerateDiagnostics(document, diagnostics);
    }
  });

  const ParseOnFocusDispose = window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      GenerateDiagnostics(editor.document, diagnostics);
    }
  });

  const ParseOnEditDispose = vscode.workspace.onDidChangeTextDocument((editor) => {
    GenerateDiagnostics(editor.document, diagnostics);
  });

  const ParseCommandDispose = vscode.commands.registerCommand("accessibility-checker.generateReport", () => {
    CreateWebview(context);
  });

  const CreateFileCommandDispose = vscode.commands.registerCommand(
    "accessibility-checker.generateReportFile",
    async () => {
      await GenerateReportFile(context);
    });

  const CreateJSONCommandDispose = vscode.commands.registerCommand(
    "accessibility-checker.generateJson",
    async () => {
      await GenerateJSON(context);
    });

  const checkerStatusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000
  );

  const checkerStatusBar2: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000
  );

  const checkerStatusBar3: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000
  );

  checkerStatusBar.command = "accessibility-checker.generateReport";
  checkerStatusBar.text = "$(empty-window) Generate Report";
  checkerStatusBar.show();

  checkerStatusBar2.command = "accessibility-checker.generateReportFile";
  checkerStatusBar2.text = "$(new-file) Generate Report File";
  checkerStatusBar2.show();

  checkerStatusBar3.command = "accessibility-checker.generateJson";
  checkerStatusBar3.text = "$(bracket) Generate JSON data";
  checkerStatusBar3.show()


  const CleanupOnDocCloseDispose = vscode.workspace.onDidCloseTextDocument((document) =>
    diagnostics.delete(document.uri)
  );

  context.subscriptions.push(
    ParseOnFocusDispose,
    ParseOnEditDispose,
    ParseOnConfigUpdateDispose,
    ParseCommandDispose,
    checkerStatusBar,
    checkerStatusBar2,
    CleanupOnDocCloseDispose,
    CreateFileCommandDispose
  );
}

export function deactivate() {}

//Recurses through document, calling appropriate functions for each tag type. Adds diagnostics to a list and returns it.
function ParseDocument(document: string): Diagnostic[] {
  const guidelines = GuidelineList;
  const $ = cheerio.load(document, { sourceCodeLocationInfo: true });
  const diagnostics: Diagnostic[] = []; //Overall list of diagnostics. Appended to each time an error is found
  traverse($.root());

  function traverse(node: cheerio.Cheerio<cheerio.AnyNode>) {
    node.contents().each(function (i, node) {
      if (!isElement(node)) return;
      //For each element (skip comments, text nodes, etc.), run the full suite of checks for errors and add them to the list. Recurse.
      guidelines.forEach((func) => {
        diagnostics.push(...func($, node));
      });
      traverse($(node));
    });
  }
  return diagnostics;
}

//Called by VSCode on every document change/edit. We modify the provided collection with a new set of diagnostics.
//Could potentially become resource intensive, consider checking what changes occur and only checking tags in that area?
function GenerateDiagnostics(document: TextDocument, workspaceDiagnostics: DiagnosticCollection): void {
  if (!languages.match({ language: "html" }, document)) {
    return;
  }
  const newDiagnostics = ParseDocument(document.getText());
  workspaceDiagnostics.set(document.uri, newDiagnostics);
}

function GenerateReportData() {
  if (!vscode.workspace.workspaceFolders) return;

  const newDiagnostics: FileDiagnostics[] = [];
  let guidelines: string[] = [];
  let tallies: number[] = [0, 0, 0, 0];
  let amount: string[] = [];
  let messages: string[] = [];
  const results: FileStats[] = [];
  let codeMap: Record<string, string> = {};


  //User can hypothetically have multiple workspaces in one window
  for (const folder of vscode.workspace.workspaceFolders) {
    for (const file of walk(folder.uri.fsPath)) {
      //Push obj pairing a filepath with its list of diagnostics for use when we separate the data per file (like the PIT extension)
      const fileName = path.basename(file);
      newDiagnostics.push({
        title: fileName,
        path: file,
        relativePath: file.replace(folder.uri.fsPath, "."),
        diagnostics: [...ParseDocument(fs.readFileSync(file).toString())],
      });
    }
  }
  //Get the data for each file. Current dirty solution is to just merge the results as we go, but this should be improved.
  for (const file of newDiagnostics) {
    const tempResults = getTallies(file.diagnostics);
    results.push({
      ...file,
      statistics: {
        guidelines: tempResults.guidelines,
        tallies: tempResults.tallies,
        amount: tempResults.amount,
        messages: tempResults.messages,
        codeMap: tempResults.codeMap,
      },
    });
    //This is the merging of data. Ignore this when judging the code
    codeMap = {...codeMap, ...tempResults.codeMap};
    for (const guideline of tempResults.guidelines) {
      if (guidelines.includes(guideline)) {
        amount[guidelines.indexOf(guideline)] = (
          Number(amount[guidelines.indexOf(guideline)]) +
          Number(tempResults.amount[tempResults.guidelines.indexOf(guideline)])
        ).toString();
      } else {
        guidelines.push(guideline);
        amount.push(tempResults.amount[tempResults.guidelines.indexOf(guideline)]);
      }
    }
    tallies = tallies.map((val, i) => val + tempResults.tallies[i]);
    codeMap = sortCodes(codeMap);
    messages.push(...tempResults.messages);

  }
  //I casted it to a set to remove duplicates, but then the length doesn't match guidelines... fix this later
  messages = [...new Set(messages)].slice(0, guidelines.length);

  return { guidelines, tallies, amount, messages, codeMap, results };
}

function getTallies(diagnostics: Diagnostic[]): Results {
  let tallies: number[] = [0, 0, 0, 0];
  let guidelines: string[] = [];
  let amount: number[] = [];
  let amntStrg: string[] = [];
  let messages: string[] = [];
  let codeMap: Record<string, string> = {};

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

      let message: string = func.message;
      let code: string = func.code.toString();

      if(!codeMap.hasOwnProperty(func.message)){
        codeMap[message] = code;
      }
    }
  });

  amount.forEach((func) => {
    amntStrg.push(func.toString());
  });

  return { guidelines, tallies, amount: amntStrg, messages, codeMap };
}

function sortDiagnostics(diagnostics: Diagnostic[]) {
  diagnostics.sort((one, two) => {
    if (one && two && one.code !== undefined && two.code != undefined) {
      return one.code < two.code ? -1 : 1;
    } else {
      throw new Error("one or two is undefined or their code is undefined.");
    }
  });
}

function sortCodes(codeMap: Record<string, string>){
  const codeValues = Object.entries(codeMap);
  const sortedCodes: Record<string, string> = {}
  codeValues.sort((a,b) => {
    if(a && b){
      return a[1] < b[1] ? -1 : 1;
    } else{
      throw new Error('a or b is undefined');
    }
  })
  for(const [key, value] of codeValues) {
    sortedCodes[key] = value;
  }
  return sortedCodes;
}

async function GenerateJSON(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) return;

  const { guidelines, tallies, amount, messages, codeMap, results } = GenerateReportData() || {
    guidelines: [],
    tallies: [],
    amount: [],
    messages: [],
    results: [],
  };
  
  const jsonContent = JSON.stringify({ guidelines, tallies, amount, messages, results })

  const path = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "ACReport.html").fsPath;

  const desiredPathInfo = await window.showSaveDialog({
    defaultUri: vscode.workspace.workspaceFolders[0].uri,
    filters: { "JSON Document": ["json"] },
  });
  if (desiredPathInfo) {
    fs.writeFileSync(desiredPathInfo.fsPath, jsonContent, { flag: "w", encoding: "utf8" });
  }
}

async function GenerateReportFile(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) return;

  const { guidelines, tallies, amount, messages, codeMap, results } = GenerateReportData() || {
    guidelines: [],
    tallies: [],
    amount: [],
    messages: [],
    results: [],
  };

  const htmlContent = GenerateReportContent({
    type: "file",
    stylesPaths: [vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.css")],
    scriptsPaths: [
      vscode.Uri.joinPath(context.extensionUri, "src", "chart", "chart.umd.js"),
      vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.js"),
    ],
    viewPath: vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.html").fsPath,
    data: JSON.stringify({ guidelines, tallies, amount, messages, results }),
  });

  const path = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "ACReport.html").fsPath;

  const desiredPathInfo = await window.showSaveDialog({
    defaultUri: vscode.workspace.workspaceFolders[0].uri,
    filters: { "HTML Document": ["html"] },
  });
  if (desiredPathInfo) {
    fs.writeFileSync(desiredPathInfo.fsPath, htmlContent, { flag: "w", encoding: "utf8" });
  }

}

function CreateWebview(context: vscode.ExtensionContext) {
  window.showInformationMessage("Generating Report...");
  const { guidelines, tallies, amount, messages, codeMap, results } = GenerateReportData() || {
    guidelines: [],
    tallies: [],
    amount: [],
    messages: [],
    codeMap: {},
    results: [],
  };

  // Create a webview panel
  const panel = vscode.window.createWebviewPanel(
    "dataVisualization",
    "Data Visualization",
    { preserveFocus: true, viewColumn: -1 },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  //VSCode restricts access to files. Get the file paths and convert those to webview URIs instead to access them inside of the HTML.
  const stylesPath = vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.css");
  const scriptsPath = vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.js");
  const viewPath = vscode.Uri.joinPath(context.extensionUri, "src", "report", "report.html");

  //This function will read the html file at viewPath. That will have <script> and <link> tags that will read from
  //scriptsPath and stylesPath respectively.
  const htmlContent = GenerateReportContent({
    type: "webview",
    stylesPath: panel.webview.asWebviewUri(stylesPath),
    scriptsPath: panel.webview.asWebviewUri(scriptsPath),
    viewPath: viewPath.fsPath,
  });

  // Set the HTML content then send the data, triggering our scripts to run
  panel.webview.html = htmlContent;
  panel.webview.postMessage({ guidelines, tallies, amount, messages, codeMap, results });
  panel.webview.onDidReceiveMessage(async (rawMessage) => {
    const message = WebviewMessageSchema.parse(rawMessage);
    switch (message.command) {
      case "linkTo":
        const fileURI = vscode.Uri.file(message.path);

        //Find tabgroup of file
        for (const tabGroup of window.tabGroups.all) {
          for (const tab of tabGroup.tabs) {
            if (tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === fileURI.toString()) {
              //File is already opened: open the correct viewColumn and it will be focused automatically
              const viewColumn = tab.group.viewColumn;
              await window.showTextDocument(fileURI, {
                selection: new vscode.Range(
                  new vscode.Position(message.range[0].line, message.range[0].character),
                  new vscode.Position(message.range[1].line, message.range[1].character)
                ),
                preview: false,
                viewColumn: viewColumn,
              });
              return;
            }
          }
        }

        //If reached, file was not already opened. Open in first viewcolumn always.
        window.showTextDocument(fileURI, {
          selection: new vscode.Range(
            new vscode.Position(message.range[0].line, message.range[0].character),
            new vscode.Position(message.range[1].line, message.range[1].character)
          ),
          preview: false,
          viewColumn: 1,
        });
    }
  });
}
