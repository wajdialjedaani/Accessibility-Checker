import { Cheerio, CheerioAPI, Element, AnyNode } from "cheerio";
import * as cheerio from "cheerio";
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";
import { isElement } from "./util";

export function CheckImageTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for an alt attribute on each img
  if (element.attribs.alt === undefined) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include an alt attribute on every image",
        range: new Range(range[0], range[1]),
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckHTMLTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (!element.attribs.lang) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include a lang attribute to provide the page's language.",
        range: new Range(range[0], range[1]),
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckATags($: CheerioAPI, element: Element): Diagnostic[] {
  if (!element.attribs.href) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include an href attribute to make text a hyperlink.",
        range: new Range(range[0], range[1]),
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}
export function CheckTitleTags($: CheerioAPI, element: Element): Diagnostic[] {
  let containsTitle = 0;
  const range = GetStartTagPosition(element);
  if (!range) return [];
  const children = $(element).children();
  for(let child of children) {
    if (child.name === "title"){
      containsTitle = 1;
    }
  }
  if (containsTitle === 0){
    return [
      {
        code: "",
        message: "Include a title for each page.",
        range: new Range(range[0], range[1]),
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return []; 
}

/*
export function CheckTableTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (!element.attribs.caption) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include a caption attribute to describe tables.",
        range: new Range(range[0], range[1]),
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}
*/

function GetStartTagPosition(element: Element): Position[] | undefined {
  const location = element.sourceCodeLocation;
  if (!location || !location.startTag) {
    console.log("No tag location");
    return undefined;
  }
  return [
    new Position(location.startTag.startLine - 1, location.startTag.startCol - 1),
    new Position(location.startTag.endLine - 1, location.startTag.endCol - 1),
  ];
}
