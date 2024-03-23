let ThemeWatcher;

class ClassWatcher {
  constructor(targetNode, classToWatch, classAddedCallback, classRemovedCallback) {
    this.targetNode = targetNode;
    this.classToWatch = classToWatch;
    this.classAddedCallback = classAddedCallback;
    this.classRemovedCallback = classRemovedCallback;
    this.observer = null;
    this.lastClassState = targetNode.classList.contains(this.classToWatch);

    this.init();
  }

  init() {
    this.observer = new MutationObserver(this.mutationCallback);
    this.observe();
  }

  observe() {
    this.observer.observe(this.targetNode, { attributes: true });
  }

  disconnect() {
    this.observer.disconnect();
  }

  mutationCallback = (mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        let currentClassState = mutation.target.classList.contains(this.classToWatch);
        if (this.lastClassState !== currentClassState) {
          this.lastClassState = currentClassState;
          if (currentClassState) {
            this.classAddedCallback();
          } else {
            this.classRemovedCallback();
          }
        }
      }
    }
  };
}

//If in webview, we need to import and define dependencies, but we don't want to
//overwrite them in a browser environment, so we check first.
if (typeof Chart === "undefined") {
  var {
    Chart,
    Colors,
    PieController,
    BarController,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Legend,
    Tooltip,
  } = {};
}

//This is the "entry point" for our scripting. Doing it like this allows us to receive any necessary data
//from our extension before running code within the scope of the webview. Follow the way it's done below:
//names will remain the same as they are within extension.ts. They are properties of the data object.
//I currently destructure all the important ones into their own vars.
if (typeof acquireVsCodeApi === "function") {
  //We are located in a VSCode Webview
  window.addEventListener("message", async (event) => {
    const chartjs = await import("../chart/chart.js");
    ({
      Chart,
      Colors,
      PieController,
      BarController,
      ArcElement,
      BarElement,
      CategoryScale,
      LinearScale,
      Legend,
      Tooltip,
    } = chartjs);
    Chart.register(
      Colors,
      PieController,
      BarController,
      ArcElement,
      BarElement,
      CategoryScale,
      LinearScale,
      Legend,
      Tooltip
    );
    const vscode = acquireVsCodeApi();
    main({ ...event.data, vscode });
  });
} else {
  //We are located in a web browser
  document.querySelector("body").classList.add("web-dark");
  document.querySelector("body").style.backgroundColor = "black";
  main(data);
}

function main(props) {
  //This should be called once. All other webview updating (as of now) is done through event listeners on the tabs
  //Generate tabs once, and pre-generate the summary to display initially
  InitListeners();
  GenerateTabs(props);
  GenerateTables({
    guidelines: props.guidelines,
    tallies: props.tallies,
    amount: props.amount,
    messages: props.messages,
  });
}

function InitListeners() {
  document.querySelector(".tab").addEventListener("wheel", HorizontalScroll);
}

function CheckEmpty(guidelines) {
  container = document.getElementById("container");
  emptyContainer = document.getElementById("empty-container");

  if (guidelines.length === 0) {
    emptyContainer.style.display = "block";
    container.style.display = "none";
  } else {
    emptyContainer.style.display = "none";
    container.style.display = "block";
  }
}

function GenerateTabs({ results, ...rest }) {
  const container = document.querySelector(".tab");
  const mainContainer = document.getElementById("container");
  const emptyContainer = document.getElementById("empty-container");
  //Generate one tab element for each file that we have statistics for, then append them.
  for (const result of results) {
    const title = result.relativePath;
    const button = document.createElement("button");
    button.addEventListener("click", function (event) {
      EraseContents();
      this.classList.add("active");
      if (result.statistics.guidelines.length === 0) {
        mainContainer.style.display = "none";
        emptyContainer.style.display = "block";
      } else {
        mainContainer.style.display = "block";
        emptyContainer.style.display = "none";
        GenerateTables(result.statistics);
        GenerateList({ result, vscode: rest.vscode });
      }
    });
    button.classList.add("tablinks");
    const buttonText = document.createElement("p");
    buttonText.classList.add("text");
    buttonText.innerText = title;
    button.appendChild(buttonText);
    container.appendChild(button);
  }

  //Generate one button separate from the others for the overall report. Add it in the first spot
  const button = document.createElement("button");
  button.addEventListener("click", function (event) {
    //Clean up existing stuff if it exists. Then generate again with the data for this file.
    EraseContents();
    this.classList.add("active");
    GenerateTables({
      guidelines: rest.guidelines,
      tallies: rest.tallies,
      amount: rest.amount,
      messages: rest.messages,
    });
  });
  button.classList.add("tablinks");
  const buttonText = document.createElement("p");
  buttonText.classList.add("text");
  buttonText.innerText = "Overall";
  button.appendChild(buttonText);
  container.prepend(button);
}

function GenerateTables({ guidelines, tallies, amount, messages }) {
  const xValues = ["Perceivable", "Operable", "Understandable", "Robust"];
  const yValues = [tallies[0], tallies[1], tallies[2], tallies[3]];
  const barColors = ["#b91d47", "#00aba9", "#2b5797", "#e8c3b9", "#1e7145", "#00bf7d", "#8babf1", "#e6308a", "#89ce00"];
  Chart.defaults.color = "white";

  const pieChart = new Chart("myChart", {
    type: "pie",
    data: {
      labels: xValues,
      fontColor: "white",
      datasets: [
        {
          backgroundColor: barColors,
          data: yValues,
          fontColor: "white",
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Guideline Category",
        fontColor: "white",
      },
      legend: {
        labels: {
          fontColor: "white",
        },
      },
    },
  });

  const aValues = guidelines;
  const bValues = amount;

  const barChart = new Chart("myChart2", {
    type: "bar",
    data: {
      labels: aValues,
      datasets: [
        {
          axis: "y",
          backgroundColor: barColors,
          data: bValues,
          fontColor: "#ffffff",
          borderColor: "white",
        },
      ],
    },
    options: {
      indexAxis: "y",
      legend: { display: false },
      title: {
        display: true,
        text: "Guideline Frequency",
        fontColor: "#ffffff",
      },
      scales: {
        y: {
          ticks: {
            beginAtZero: true,
            color: "white",
          },
        },
        x: {
          ticks: {
            color: "white",
          },
        },
      },
    },
  });

  // Example arrays for codes and messages
  var codeArray = guidelines;
  var messageArray = messages;

  // Function to fill the table with data from the arrays
  function fillTable(codeArray, messageArray) {
    var tableBody = document.getElementById("data-table").getElementsByTagName("tbody")[0];

    // Ensure both arrays are of equal length
    if (codeArray.length !== messageArray.length) {
      console.log(codeArray.length);
      console.log(messageArray.length);
      console.error("Arrays must be of equal length.");
      return;
    }

    // Iterate over the arrays and create rows in the table
    for (var i = 0; i < codeArray.length; i++) {
      var row = tableBody.insertRow();
      var codeCell = row.insertCell(0);
      var messageCell = row.insertCell(1);
      //const codeText = document.createElement("p");
      //const messageText = document.createElement("p");
      //codeText.innerText
      codeCell.textContent = codeArray[i];
      messageCell.textContent = messageArray[i];
    }
  }

  // Call the function to fill the table with the provided arrays
  fillTable(codeArray, messageArray);

  if (document.querySelector("body").classList.contains("vscode-light")) {
    ToggleOnLightMode([pieChart, barChart]);
  } else {
    ToggleOnDarkMode([pieChart, barChart]);
  }

  ThemeWatcher = new ClassWatcher(
    document.querySelector("body"),
    "vscode-light",
    () => {
      ToggleOnLightMode([pieChart, barChart]);
    },
    () => {
      ToggleOnDarkMode([pieChart, barChart]);
    }
  );
}

function GenerateList({ result: fileData, vscode }) {
  const container = document.querySelector(".list-container");
  for (const diagnostic of fileData.diagnostics) {
    const row = document.createElement("div");
    row.classList.add("list-row");
    const items = [];
    const link = document.createElement("a");
    link.classList.add("list-item");
    link.classList.add("list-link");
    const fileName = document.createElement("div");
    fileName.classList.add("list-item");
    fileName.classList.add("list-message");
    fileName.innerHTML = escape(diagnostic.message);
    link.innerHTML = `${diagnostic.range[0].line}:${diagnostic.range[0].character}`;

    link.addEventListener("click", () => {
      if (vscode) LinkToError({ path: fileData.path, diagnostic, vscode });
    });

    row.appendChild(link);
    row.appendChild(fileName);

    container.appendChild(row);
  }
}

function HorizontalScroll(event) {
  if (
    (event.deltaY < 0 && this.scrollLeft === 0) ||
    (event.deltaY > 0 && this.scrollLeft + this.clientWidth > this.scrollWidth - 1)
  ) {
    return;
  }
  event.preventDefault();
  this.scrollLeft += event.deltaY;
}

function ToggleOnLightMode(charts) {
  for (const chart of charts) {
    chart.options.plugins.legend.labels.color = "#000000";
    if (chart.options.scales?.y?.ticks?.color) chart.options.scales.y.ticks.color = "#000000";
    if (chart.options.scales?.x?.ticks?.color) chart.options.scales.x.ticks.color = "#000000";
    chart.options;
    chart.update();
  }
}

function ToggleOnDarkMode(charts) {
  for (const chart of charts) {
    chart.options.plugins.legend.labels.color = "#ffffff";
    if (chart.options.scales?.y?.ticks?.color) chart.options.scales.y.ticks.color = "#ffffff";
    if (chart.options.scales?.x?.ticks?.color) chart.options.scales.x.ticks.color = "#ffffff";
    chart.update();
  }
}

function EraseContents() {
  Chart.getChart("myChart")?.destroy();
  Chart.getChart("myChart2")?.destroy();
  document.querySelector("#data-table tbody").innerHTML = "";
  document.querySelector(".list-container").innerHTML = "";
  document.querySelectorAll(".tablinks").forEach((element) => element.classList.remove("active"));
}

function escape(htmlStr) {
  return htmlStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function LinkToError({ diagnostic, vscode, path }) {
  vscode.postMessage({
    command: "linkTo",
    range: diagnostic.range,
    path: path,
  });
}
