import { AnyNode, Element } from "cheerio";
import * as vscode from "vscode";

export function isElement(node: AnyNode): node is Element {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

export enum NodeType {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE = 2,
  TEXT_NODE = 3,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 9,
}

//Singleton class that allows for synchronized settings across the project with auto-updating
export class Configuration {
  static #_instance: any;
  #config!: vscode.WorkspaceConfiguration;

  constructor(context?: vscode.ExtensionContext) {
    if (!Configuration.#_instance) {
      if (context) {
        Configuration.#_instance = this;
        this.initialize(context);
      } else {
        throw new Error("Please initialize Configuration with a vscode context first.");
      }
    }
    return Configuration.#_instance;
  }

  static GetInstance(): Configuration {
    if (!Configuration.#_instance) {
      throw new Error("Please initialize Configuration with a vscode context first.");
    }
    return Configuration.#_instance;
  }

  //Called once upon creation of first instance
  initialize(context: vscode.ExtensionContext) {
    this.#config = vscode.workspace.getConfiguration("accessibilityChecker");
    if (!this.#config) {
      throw new Error("Error retrieving config");
    }
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("accessibilityChecker")) {
          this.#config = vscode.workspace.getConfiguration("accessibilityChecker");
        }
      })
    );
  }

  get(section?: string): vscode.WorkspaceConfiguration | any {
    if (section) {
      return this.#config.get(section);
    }
    return this.#config;
  }
}
