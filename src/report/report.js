//This is the "entry point" for our scripting. Doing it like this allows us to receive any necessary data
//from our extension before running code within the scope of the webview. Follow the way it's done below:
//names will remain the same as they are within extension.ts. They are properties of the data object.
//I currently destructure all the important ones into their own vars.
window.addEventListener("message", (event) => {
  main(event.data);
});

function main(props) {
  //This should be called once. All other webview updating (as of now) is done through event listeners on the tabs
  //Generate tabs once, and pre-generate the summary to display initially
  GenerateTabs(props);
  GenerateTables({
    guidelines: props.guidelines,
    tallies: props.tallies,
    amount: props.amount,
    messages: props.messages,
  });
}

function GenerateTabs({ results, ...rest }) {
  const container = document.querySelector(".tab");
  //Generate one tab element for each file that we have statistics for, then append them.
  for (const result of results) {
    const title = result.title
    const button = document.createElement("button");
    button.addEventListener("click", (event) => {
      Chart.getChart("myChart")?.destroy();
      Chart.getChart("myChart2")?.destroy();
      document.querySelector("#data-table tbody").innerHTML = "";
      GenerateTables(result.statistics);
    });
    button.classList.add("tablinks");
    button.innerText = title;
    container.appendChild(button);
  }

  //Generate one button separate from the others for the overall report. Add it in the first spot
  const button = document.createElement("button");
  button.addEventListener("click", (event) => {
    //Clean up existing stuff if it exists. Then generate again with the data for this file.
    Chart.getChart("myChart")?.destroy();
    Chart.getChart("myChart2")?.destroy();
    document.querySelector("#data-table tbody").innerHTML = "";
    GenerateTables({
      guidelines: rest.guidelines,
      tallies: rest.tallies,
      amount: rest.amount,
      messages: rest.messages,
    });
  });
  button.classList.add("tablinks");
  button.innerText = "Overall";
  container.prepend(button);
}

function GenerateTables({ guidelines, tallies, amount, messages }) {
  const xValues = ["Perceivable", "Operable", "Understandable", "Robust"];
  const yValues = [tallies[0], tallies[1], tallies[2], tallies[3]];
  const barColors = ["#b91d47", "#00aba9", "#2b5797", "#e8c3b9", "#1e7145", "#00bf7d", "#8babf1", "#e6308a", "#89ce00"];
  Chart.defaults.color = "white";

  new Chart("myChart", {
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

  new Chart("myChart2", {
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
            fontColor: "white",
          },
        },
        x: {
          ticks: {
            fontColor: "white",
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

      codeCell.textContent = codeArray[i];
      messageCell.textContent = messageArray[i];
    }
  }

  // Call the function to fill the table with the provided arrays
  fillTable(codeArray, messageArray);
}
