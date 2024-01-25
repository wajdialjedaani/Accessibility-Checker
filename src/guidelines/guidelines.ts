import { Cheerio, Element, AnyNode, CheerioAPI } from "cheerio";
import { TextEditorSelectionChangeKind } from "vscode";
import * as vscode from "vscode";

export function check_a(document: CheerioAPI, element: Cheerio<AnyNode>){
    console.log("Success");
}