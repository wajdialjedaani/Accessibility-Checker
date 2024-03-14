import * as vscode from "vscode";
import * as cheerio from "cheerio";
import { Cheerio, Element, AnyNode, CheerioAPI } from "cheerio";
import { window, languages, TextDocument, DiagnosticCollection, workspace, Diagnostic } from "vscode";
import { isElement, Configuration, ConfigSchema } from "./util";
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

export function activate(context: vscode.ExtensionContext) {
  let config = new Configuration(context);

  //This collection will persist throughout life of extension
  const diagnostics = languages.createDiagnosticCollection("Test");
  const document = window.activeTextEditor?.document;
  const checkerStatusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);

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
  let dispo = vscode.commands.registerCommand("accessibility-checker.generateReport", GenerateReport);
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
function ParseDocument(document: TextDocument) {
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
  const text = document.getText();
  const $ = cheerio.load(text, { sourceCodeLocationInfo: true });
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
  const newDiagnostics = ParseDocument(document);
  diagnostics.set(document.uri, newDiagnostics);
}

function GenerateReport(): void {
  const document = window.activeTextEditor?.document;
  let newDiagnostics: Diagnostic[];
  let names: String[];
  let tallies: number[] = [0, 0, 0, 0];

  if(document){
    newDiagnostics = ParseDocument(document);
  }
  else{
    newDiagnostics = [];
  }

  tallies = getTallies(newDiagnostics);
  let total = tallies[0] + tallies[1] + tallies[2] + tallies[3];
  let perceivable = ((tallies[0] / total) * 360).toFixed();
  let operable = ((tallies[1] / total) * 360).toFixed();
  let understandable = ((tallies[2] / total) * 360).toFixed();
  let robust = ((tallies[3] / total) * 360).toFixed();
  //console.log(tallies[0], tallies[1], tallies[2], tallies[3]);




  window.showInformationMessage("Generating Report...");
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
    <body>
    
    <canvas id="myChart" style="width:100%;max-width:600px"></canvas>
    
    <script>
    const xValues = ["Perceivable", "Operable", "Understandable", "Robust"];
    const yValues = ["${tallies[0]}", "${tallies[1]}", "${tallies[2]}", "${tallies[3]}"];
    const barColors = [
      "#b91d47",
      "#00aba9",
      "#2b5797",
      "#e8c3b9",
      "#1e7145"
    ];
    
    new Chart("myChart", {
      type: "pie",
      data: {
        labels: xValues,
        datasets: [{
          backgroundColor: barColors,
          data: yValues
        }]
      },
      options: {
        title: {
          display: true,
          text: "Accessibility Checker Report"
        }
      }
    });
    </script>
    
    </body>
    </html>
  
  `;

  // Create a webview panel
  const panel = vscode.window.createWebviewPanel(
    'dataVisualization',
    'Data Visualization',
    vscode.ViewColumn.One,
    {enableScripts:true}
  );

  // Set the HTML content
  panel.webview.html = htmlContent;

}

function getTallies(diagnostics: Diagnostic[]){
  let tallies: number[] = [0, 0, 0, 0];

  diagnostics.forEach((func) => {
    if(func.code === 1){
      tallies[0] += 1;
    } else if(func.code === 2){
      tallies[1] += 1;
    } else if(func.code === 3){
      tallies[2] += 1;
    }else if(func.code === 4){  
      tallies[3] += 1;
    }
  });
  return tallies;
}