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

/**
 * TreeJS is a JavaScript librarie for displaying TreeViews
 * on the web.
 *
 * @author Matthias Thalmann
 */

function TreeView(root, container, options) {
  var self = this;

  /*
   * Konstruktor
   */
  if (typeof root === "undefined") {
    throw new Error("Parameter 1 must be set (root)");
  }

  if (!(root instanceof TreeNode)) {
    throw new Error("Parameter 1 must be of type TreeNode");
  }

  if (container) {
    if (!TreeUtil.isDOM(container)) {
      container = document.querySelector(container);

      if (container instanceof Array) {
        container = container[0];
      }

      if (!TreeUtil.isDOM(container)) {
        throw new Error("Parameter 2 must be either DOM-Object or CSS-QuerySelector (#, .)");
      }
    }
  } else {
    container = null;
  }

  if (!options || typeof options !== "object") {
    options = {};
  }

  /*
   * Methods
   */
  this.setRoot = function (_root) {
    if (root instanceof TreeNode) {
      root = _root;
    }
  };

  this.getRoot = function () {
    return root;
  };

  this.expandAllNodes = function () {
    root.setExpanded(true);

    root.getChildren().forEach(function (child) {
      TreeUtil.expandNode(child);
    });
  };

  this.expandPath = function (path) {
    if (!(path instanceof TreePath)) {
      throw new Error("Parameter 1 must be of type TreePath");
    }

    path.getPath().forEach(function (node) {
      node.setExpanded(true);
    });
  };

  this.collapseAllNodes = function () {
    root.setExpanded(false);

    root.getChildren().forEach(function (child) {
      TreeUtil.collapseNode(child);
    });
  };

  this.setContainer = function (_container) {
    if (TreeUtil.isDOM(_container)) {
      container = _container;
    } else {
      _container = document.querySelector(_container);

      if (_container instanceof Array) {
        _container = _container[0];
      }

      if (!TreeUtil.isDOM(_container)) {
        throw new Error("Parameter 1 must be either DOM-Object or CSS-QuerySelector (#, .)");
      }
    }
  };

  this.getContainer = function () {
    return container;
  };

  this.setOptions = function (_options) {
    if (typeof _options === "object") {
      options = _options;
    }
  };

  this.changeOption = function (option, value) {
    options[option] = value;
  };

  this.getOptions = function () {
    return options;
  };

  // TODO: set selected key: up down; expand right; collapse left; enter: open;
  this.getSelectedNodes = function () {
    return TreeUtil.getSelectedNodesForNode(root);
  };

  this.reload = function () {
    if (container == null) {
      console.warn("No container specified");
      return;
    }

    container.classList.add("tj_container");

    var cnt = document.createElement("ul");

    if (TreeUtil.getProperty(options, "show_root", true)) {
      cnt.appendChild(renderNode(root));
    } else {
      root.getChildren().forEach(function (child) {
        cnt.appendChild(renderNode(child));
      });
    }

    container.innerHTML = "";
    container.appendChild(cnt);
  };

  function renderNode(node) {
    var li_outer = document.createElement("li");
    var span_desc = document.createElement("span");
    span_desc.className = "tj_description";
    span_desc.tj_node = node;

    if (!node.isEnabled()) {
      li_outer.setAttribute("disabled", "");
      node.setExpanded(false);
      node.setSelected(false);
    }

    if (node.isSelected()) {
      span_desc.classList.add("selected");
    }

    span_desc.addEventListener("click", function (e) {
      var cur_el = e.target;

      while (typeof cur_el.tj_node === "undefined" || cur_el.classList.contains("tj_container")) {
        cur_el = cur_el.parentElement;
      }

      var node_cur = cur_el.tj_node;

      if (typeof node_cur === "undefined") {
        return;
      }

      if (node_cur.isEnabled()) {
        if (e.ctrlKey == false) {
          if (!node_cur.isLeaf()) {
            node_cur.toggleExpanded();
            self.reload();
          } else {
            node_cur.open();
          }

          node_cur.on("click")(e, node_cur);
        }

        if (e.ctrlKey == true) {
          node_cur.toggleSelected();
          self.reload();
        } else {
          var rt = node_cur.getRoot();

          if (rt instanceof TreeNode) {
            TreeUtil.getSelectedNodesForNode(rt).forEach(function (_nd) {
              _nd.setSelected(false);
            });
          }
          node_cur.setSelected(true);

          self.reload();
        }
      }
    });

    span_desc.addEventListener("contextmenu", function (e) {
      var cur_el = e.target;

      while (typeof cur_el.tj_node === "undefined" || cur_el.classList.contains("tj_container")) {
        cur_el = cur_el.parentElement;
      }

      var node_cur = cur_el.tj_node;

      if (typeof node_cur === "undefined") {
        return;
      }

      if (typeof node_cur.getListener("contextmenu") !== "undefined") {
        node_cur.on("contextmenu")(e, node_cur);
        e.preventDefault();
      } else if (typeof TreeConfig.context_menu === "function") {
        TreeConfig.context_menu(e, node_cur);
        e.preventDefault();
      }
    });

    if (node.isLeaf() && !TreeUtil.getProperty(node.getOptions(), "forceParent", false)) {
      var ret = "";
      var icon = TreeUtil.getProperty(node.getOptions(), "icon", "");
      if (icon != "") {
        ret += '<span class="tj_icon">' + icon + "</span>";
      } else if ((icon = TreeUtil.getProperty(options, "leaf_icon", "")) != "") {
        ret += '<span class="tj_icon">' + icon + "</span>";
      } else {
        ret += '<span class="tj_icon">' + TreeConfig.leaf_icon + "</span>";
      }

      span_desc.innerHTML = ret + node.toString() + "</span>";
      span_desc.classList.add("tj_leaf");

      li_outer.appendChild(span_desc);
    } else {
      var ret = "";
      if (node.isExpanded()) {
        ret += '<span class="tj_mod_icon">' + TreeConfig.open_icon + "</span>";
      } else {
        ret += '<span class="tj_mod_icon">' + TreeConfig.close_icon + "</span>";
      }

      var icon = TreeUtil.getProperty(node.getOptions(), "icon", "");
      if (icon != "") {
        ret += '<span class="tj_icon">' + icon + "</span>";
      } else if ((icon = TreeUtil.getProperty(options, "parent_icon", "")) != "") {
        ret += '<span class="tj_icon">' + icon + "</span>";
      } else {
        ret += '<span class="tj_icon">' + TreeConfig.parent_icon + "</span>";
      }

      span_desc.innerHTML = ret + node.toString() + "</span>";

      li_outer.appendChild(span_desc);

      if (node.isExpanded()) {
        var ul_container = document.createElement("ul");

        node.getChildren().forEach(function (child) {
          ul_container.appendChild(renderNode(child));
        });

        li_outer.appendChild(ul_container);
      }
    }

    return li_outer;
  }

  if (typeof container !== "undefined") this.reload();
}

function TreeNode(userObject, options) {
  var children = new Array();
  var self = this;
  var events = new Array();

  var expanded = true;
  var enabled = true;
  var selected = false;

  /*
   * Konstruktor
   */
  if (userObject) {
    if (typeof userObject !== "string" && typeof userObject.toString !== "function") {
      throw new Error("Parameter 1 must be of type String or Object, where it must have the function toString()");
    }
  } else {
    userObject = "";
  }

  if (!options || typeof options !== "object") {
    options = {};
  } else {
    expanded = TreeUtil.getProperty(options, "expanded", true);
    enabled = TreeUtil.getProperty(options, "enabled", true);
    selected = TreeUtil.getProperty(options, "selected", false);
  }

  /*
   * Methods
   */
  this.addChild = function (node) {
    if (!TreeUtil.getProperty(options, "allowsChildren", true)) {
      console.warn("Option allowsChildren is set to false, no child added");
      return;
    }

    if (node instanceof TreeNode) {
      children.push(node);

      //Konstante hinzufügen (workaround)
      Object.defineProperty(node, "parent", {
        value: this,
        writable: false,
        enumerable: true,
        configurable: true,
      });
    } else {
      throw new Error("Parameter 1 must be of type TreeNode");
    }
  };

  this.removeChildPos = function (pos) {
    if (typeof children[pos] !== "undefined") {
      if (typeof children[pos] !== "undefined") {
        children.splice(pos, 1);
      }
    }
  };

  this.removeChild = function (node) {
    if (!(node instanceof TreeNode)) {
      throw new Error("Parameter 1 must be of type TreeNode");
    }

    this.removeChildPos(this.getIndexOfChild(node));
  };

  this.getChildren = function () {
    return children;
  };

  this.getChildCount = function () {
    return children.length;
  };

  this.getIndexOfChild = function (node) {
    for (var i = 0; i < children.length; i++) {
      if (children[i].equals(node)) {
        return i;
      }
    }

    return -1;
  };

  this.getRoot = function () {
    var node = this;

    while (typeof node.parent !== "undefined") {
      node = node.parent;
    }

    return node;
  };

  this.setUserObject = function (_userObject) {
    if (!(typeof _userObject === "string") || typeof _userObject.toString !== "function") {
      throw new Error("Parameter 1 must be of type String or Object, where it must have the function toString()");
    } else {
      userObject = _userObject;
    }
  };

  this.getUserObject = function () {
    return userObject;
  };

  this.setOptions = function (_options) {
    if (typeof _options === "object") {
      options = _options;
    }
  };

  this.changeOption = function (option, value) {
    options[option] = value;
  };

  this.getOptions = function () {
    return options;
  };

  this.isLeaf = function () {
    return children.length == 0;
  };

  this.setExpanded = function (_expanded) {
    if (this.isLeaf()) {
      return;
    }

    if (typeof _expanded === "boolean") {
      if (expanded == _expanded) {
        return;
      }

      expanded = _expanded;

      if (_expanded) {
        this.on("expand")(this);
      } else {
        this.on("collapse")(this);
      }

      this.on("toggle_expanded")(this);
    }
  };

  this.toggleExpanded = function () {
    if (expanded) {
      this.setExpanded(false);
    } else {
      this.setExpanded(true);
    }
  };

  this.isExpanded = function () {
    if (this.isLeaf()) {
      return true;
    } else {
      return expanded;
    }
  };

  this.setEnabled = function (_enabled) {
    if (typeof _enabled === "boolean") {
      if (enabled == _enabled) {
        return;
      }

      enabled = _enabled;

      if (_enabled) {
        this.on("enable")(this);
      } else {
        this.on("disable")(this);
      }

      this.on("toggle_enabled")(this);
    }
  };

  this.toggleEnabled = function () {
    if (enabled) {
      this.setEnabled(false);
    } else {
      this.setEnabled(true);
    }
  };

  this.isEnabled = function () {
    return enabled;
  };

  this.setSelected = function (_selected) {
    if (typeof _selected !== "boolean") {
      return;
    }

    if (selected == _selected) {
      return;
    }

    selected = _selected;

    if (_selected) {
      this.on("select")(this);
    } else {
      this.on("deselect")(this);
    }

    this.on("toggle_selected")(this);
  };

  this.toggleSelected = function () {
    if (selected) {
      this.setSelected(false);
    } else {
      this.setSelected(true);
    }
  };

  this.isSelected = function () {
    return selected;
  };

  this.open = function () {
    if (!this.isLeaf()) {
      this.on("open")(this);
    }
  };

  this.on = function (ev, callback) {
    if (typeof callback === "undefined") {
      if (typeof events[ev] !== "function") {
        return function () {};
      } else {
        return events[ev];
      }
    }

    if (typeof callback !== "function") {
      throw new Error("Argument 2 must be of type function");
    }

    events[ev] = callback;
  };

  this.getListener = function (ev) {
    return events[ev];
  };

  this.equals = function (node) {
    if (node instanceof TreeNode) {
      if (node.getUserObject() == userObject) {
        return true;
      }
    }

    return false;
  };

  this.toString = function () {
    if (typeof userObject === "string") {
      return userObject;
    } else {
      return userObject.toString();
    }
  };
}

function TreePath(root, node) {
  var nodes = new Array();

  this.setPath = function (root, node) {
    nodes = new Array();

    while (typeof node !== "undefined" && !node.equals(root)) {
      nodes.push(node);
      node = node.parent;
    }

    if (node.equals(root)) {
      nodes.push(root);
    } else {
      nodes = new Array();
      throw new Error("Node is not contained in the tree of root");
    }

    nodes = nodes.reverse();

    return nodes;
  };

  this.getPath = function () {
    return nodes;
  };

  this.toString = function () {
    return nodes.join(" - ");
  };

  if (root instanceof TreeNode && node instanceof TreeNode) {
    this.setPath(root, node);
  }
}

/*
 * Util-Methods
 */
const TreeUtil = {
  default_leaf_icon: "<span>&#128441;</span>",
  default_parent_icon: "<span>&#128449;</span>",
  default_open_icon: "<span>&#9698;</span>",
  default_close_icon: "<span>&#9654;</span>",

  isDOM: function (obj) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return (
        typeof obj === "object" &&
        obj.nodeType === 1 &&
        typeof obj.style === "object" &&
        typeof obj.ownerDocument === "object"
      );
    }
  },

  getProperty: function (options, opt, def) {
    if (typeof options[opt] === "undefined") {
      return def;
    }

    return options[opt];
  },

  expandNode: function (node) {
    node.setExpanded(true);

    if (!node.isLeaf()) {
      node.getChildren().forEach(function (child) {
        TreeUtil.expandNode(child);
      });
    }
  },

  collapseNode: function (node) {
    node.setExpanded(false);

    if (!node.isLeaf()) {
      node.getChildren().forEach(function (child) {
        TreeUtil.collapseNode(child);
      });
    }
  },

  getSelectedNodesForNode: function (node) {
    if (!(node instanceof TreeNode)) {
      throw new Error("Parameter 1 must be of type TreeNode");
    }

    var ret = new Array();

    if (node.isSelected()) {
      ret.push(node);
    }

    node.getChildren().forEach(function (child) {
      if (child.isSelected()) {
        if (ret.indexOf(child) == -1) {
          ret.push(child);
        }
      }

      if (!child.isLeaf()) {
        TreeUtil.getSelectedNodesForNode(child).forEach(function (_node) {
          if (ret.indexOf(_node) == -1) {
            ret.push(_node);
          }
        });
      }
    });

    return ret;
  },
};

var TreeConfig = {
  leaf_icon: TreeUtil.default_leaf_icon,
  parent_icon: TreeUtil.default_parent_icon,
  open_icon: TreeUtil.default_open_icon,
  close_icon: TreeUtil.default_close_icon,
  context_menu: undefined,
};

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
  const mainContainer = document.getElementById("container");
  const emptyContainer = document.getElementById("empty-container");
  const tabs = document.querySelector(".tab");
  InitListeners();
  if (props.guidelines.length === 0) {
    mainContainer.style.display = "none";
    tabs.style.display = "none";
    emptyContainer.style.display = "block";
  } else {
    mainContainer.style.display = "block";
    emptyContainer.style.display = "none";
    //GenerateTabs(props);
    GenerateTree(props);
    GenerateTables({
      guidelines: props.guidelines,
      tallies: props.tallies,
      amount: props.amount,
      messages: props.messages,
      codeMap: props.codeMap,
    });
  }
}

function GenerateTree(props) {
  const files = props.results;
  const fileTree = { name: "root", children: [] };
  for (const file of files) {
    const path = file.relativePath;
    const dirs = path.split(/[/\\]/).slice(1);
    let subTree = fileTree;
    for (let i = 0; i < dirs.length; i++) {
      if (subTree.children.find((val) => val.name === dirs[i])) {
        subTree = subTree.children.find((val) => val.name === dirs[i]);
      } else {
        subTree.children.push({ name: dirs[i], children: [], path: i === dirs.length - 1 ? path : undefined });
        subTree = subTree.children.find((val) => val.name === dirs[i]);
      }
    }
  }

  function recurse(tree, parent) {
    const node = new TreeNode(tree.name);
    if (tree.path) {
      console.log(tree.name);
      node.on("click", (event) => {
        EraseContents();
        document.querySelectorAll(".tj_container li span.tj_description.tj_leaf.active").forEach((element) => {
          element.classList.remove("active");
        });
        event.target.classList.add("active");
        const result = files.find((file) => file.title === tree.name);
        if (result.statistics.guidelines.length === 0) {
          document.getElementById("container").style.display = "none";
          document.getElementById("empty-container").style.display = "block";
        } else {
          document.getElementById("container").style.display = "block";
          document.getElementById("empty-container").style.display = "none";
          GenerateTables(result.statistics);
          GenerateList({ result, vscode: props.vscode });
        }
      });
    }
    for (const children of tree.children) {
      recurse(children, node);
    }
    if (parent) {
      parent.addChild(node);
    } else {
      return node;
    }
  }

  const root = recurse(fileTree);
  const view = new TreeView(root, ".tree");
}

function InitListeners() {
  //document.querySelector(".tab").addEventListener("wheel", HorizontalScroll);
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
    this.classList.add("active");
    //Clean up existing stuff if it exists. Then generate again with the data for this file.
    if (rest.guidelines.length === 0) {
      mainContainer.style.display = "none";
      emptyContainer.style.display = "block";
    } else {
      mainContainer.style.display = "block";
      emptyContainer.style.display = "none";
      EraseContents();
      GenerateTables({
        guidelines: rest.guidelines,
        tallies: rest.tallies,
        amount: rest.amount,
        messages: rest.messages,
        codeMap: rest.codeMap,
      });
    }
  });
  button.classList.add("tablinks");
  const buttonText = document.createElement("p");
  buttonText.classList.add("text");
  buttonText.innerText = "Overall";
  button.appendChild(buttonText);
  container.prepend(button);
}

function GenerateTables({ guidelines, tallies, amount, messages, codeMap }) {
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
      plugins: {
        legend: { display: false }
      },
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

  // Function to fill the table with data from the arrays
  function fillTable(codeMap) {
    var tableBody = document.getElementById("data-table").getElementsByTagName("tbody")[0];

    // Iterate over the arrays and create rows in the table
    for (let key in codeMap) {
      var row = tableBody.insertRow();
      var codeCell = row.insertCell(0);
      var messageCell = row.insertCell(1);
      //const codeText = document.createElement("p");
      //const messageText = document.createElement("p");
      //codeText.innerText
      codeCell.textContent = codeMap[key];
      messageCell.textContent = key;
    }
  }

  // Call the function to fill the table with the provided Code Map
  fillTable(codeMap);

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
