import * as vscode from "vscode";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { Cheerio, Element, AnyNode, CheerioAPI } from "cheerio";
import { window, languages, TextDocument, DiagnosticCollection, workspace, Diagnostic } from "vscode";
import { isElement, Configuration, ConfigSchema, walk } from "./util";
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

function GenerateReport(): void {
  if (!vscode.workspace.workspaceFolders) return;

  const document = window.activeTextEditor?.document;
  type FileDiagnostics = {
    path: string;
    diagnostics: Diagnostic[];
  };

  const newDiagnostics: FileDiagnostics[] = [];
  let guidelines: string[] = [];
  let tallies: number[] = [0, 0, 0, 0];
  let amount: string[] = [];
  let messages: string[] = [];

  //if (document) {
  //  newDiagnostics.push(...ParseDocument(document.getText()));
  //  newDiagnostics.sort((one, two) => {
  //    if (one && two && one.code !== undefined && two.code !== undefined) {
  //      return one.code < two.code ? -1 : 1;
  //    } else {
  //      throw new Error("one or two are undefined or their code is undefined");
  //    }
  //  });
  //}

  //User can hypothetically have multiple workspaces in one window
  for (const folder of vscode.workspace.workspaceFolders) {
    for (const file of walk(folder.uri.fsPath)) {
      //Push obj pairing a filepath with its list of diagnostics for use when we separate the data per file (like the PIT extension)
      newDiagnostics.push({
        path: file,
        diagnostics: [...ParseDocument(fs.readFileSync(file).toString())],
      });
    }
  }

  for (const file of newDiagnostics) {
    const {
      guidelines: tempGuidelines,
      tallies: tempTallies,
      amntStrg: tempAmount,
      messages: tempMessages,
    } = getTallies(file.diagnostics);

    console.log(tempGuidelines);
    console.log(tempTallies);
    console.log(tempAmount);
    console.log(tempMessages);

    for (const guideline of tempGuidelines) {
      if (guidelines.includes(guideline)) {
        amount[guidelines.indexOf(guideline)] = (
          Number(amount[guidelines.indexOf(guideline)]) + Number(tempAmount[tempGuidelines.indexOf(guideline)])
        ).toString();
      } else {
        guidelines.push(guideline);
        amount.push(tempAmount[tempGuidelines.indexOf(guideline)]);
      }
    }
    tallies = tallies.map((val, i) => val + tempTallies[i]);
    messages.push(...tempMessages);
  }
  messages = [...new Set(messages)].slice(0, guidelines.length);

  console.log(guidelines);
  console.log(amount);
  console.log(tallies);
  console.log(messages);
  window.showInformationMessage("Generating Report...");
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Checker Report</title>
    <style>
      .title-container {
        width: 1000px;
        text-align: center;
      }


      .chart-container {
        border: 1px solid;
        margin-bottom: 20px;
        padding: 10px;
        width: 1000px;
        text-align: center;
      }

      .chart-container canvas {
        display: inline-block;
        margin: 0 auto;
      }

      .table-container {
        border: 1px solid;
        margin-bottom: 20px;
        padding: 10px;
        width: 1000px;
        text-align: center;
        color: white;
      }

      .table-container table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      .table-container th, .table-container td {
        border: 1px solid black;
        padding: 8px;
        text-align: left;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
    <body>
    <div class="title-container">
      <h1>Accessibility Checker Report</h1>
    </div>
    <div class="chart-container">
      <canvas id="myChart" style="width:100%;max-width:800px"></canvas>
    </div>
    <div class="chart-container">
      <canvas id="myChart2" style="width:100%;max-width:800px"></canvas>
    </div>
    
    <script>
    const xValues = ["Perceivable", "Operable", "Understandable", "Robust"];
    const yValues = ["${tallies[0]}", "${tallies[1]}", "${tallies[2]}", "${tallies[3]}"];
    const barColors = [
      "#b91d47",
      "#00aba9",
      "#2b5797",
      "#e8c3b9",
      "#1e7145",
      "#00bf7d",
      "#8babf1",
      "#e6308a",
      "#89ce00"
    ];
    Chart.defaults.color = 'white';

    new Chart("myChart", {
      type: "pie",
      data: {
        labels: xValues,
        fontColor: "white",
        datasets: [{
          backgroundColor: barColors,
          data: yValues,
          fontColor: 'white'
        }]
      },
      options: {
        title: {
          display: true,
          text: "Guideline Category",
          fontColor: 'white'
        },
        legend: {
          labels: {
            fontColor: 'white'
          }
        }
      }
    });

    const aValues = ${JSON.stringify(guidelines)};
    const bValues = ${JSON.stringify(amount)};

    new Chart("myChart2", {
      type: "horizontalBar",
      data: {
        labels: aValues,
        datasets: [{
          axis: 'y',
          backgroundColor: barColors,
          data: bValues,
          fontColor: '#ffffff',
          borderColor: 'white'
        }]
      },
      options: {
        indexAxis: 'y',
        legend: {display: false},
        title: {
          display: true,
          text: "Guideline Frequency",
          fontColor: "#ffffff"
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                fontColor: 'white'
              }
            }
          ],
          xAxes: [
            {
              ticks: {
                fontColor: 'white',
              }
            }
          ]
        }
      }
    });

    </script>  

    <div class="table-container">
      <h2>Guideline Codes</h2>
      <table id="data-table">
      <thead>
          <tr>
              <th>Code</th>
              <th>Message</th>
          </tr>
      </thead>
      <tbody>
          <!-- Table rows will be added dynamically by JavaScript -->
      </tbody>
      </table>
    </div>

    <script>
    // Example arrays for codes and messages
    var codeArray = ${JSON.stringify(guidelines)};
    var messageArray = ${JSON.stringify(messages)};

    // Function to fill the table with data from the arrays
    function fillTable(codeArray, messageArray) {
        var tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
        
        // Ensure both arrays are of equal length
        if (codeArray.length !== messageArray.length) {
            console.error("Arrays must be of equal length.");
            return;
        }

        // Iterate over the arrays and create rows in the table
        for (var i = 0; i < codeArray.length; i++) {
            var row = tableBody.insertRow();
            var codeCell = row.insertCell(0);
            var messageCell = row.insertCell(1);
            
            codeCell.textContent = codeArray[i];
            messageCell.textContent = messageArray[i];
        }
    }

    // Call the function to fill the table with the provided arrays
    fillTable(codeArray, messageArray);
    </script>
    </body>
    </html>
  
  `;

  // Create a webview panel
  const panel = vscode.window.createWebviewPanel("dataVisualization", "Data Visualization", vscode.ViewColumn.One, {
    enableScripts: true,
  });

  // Set the HTML content
  panel.webview.html = htmlContent;
}

function getTallies(diagnostics: Diagnostic[]) {
  let tallies: number[] = [0, 0, 0, 0];
  let guideAmounts: [[string, number]] = [["", 0]];
  let guidelines: string[] = [];
  let amount: number[] = [];
  let amntStrg: string[] = [];
  let messages: string[] = [];
  let storage: string[] = [];

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
