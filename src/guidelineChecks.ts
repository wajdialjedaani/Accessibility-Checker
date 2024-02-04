import { Cheerio, CheerioAPI, Element, AnyNode } from "cheerio";
import * as cheerio from "cheerio";
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";
import { isElement } from "./util";

export function CheckImageTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "img") return [];
  //Check for an alt attribute on each img
  if (!element.attribs.alt) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include an alt attribute on every image",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckHTMLTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "html") return [];
  //Check for lang attribute when using html tag
  if (!element.attribs.lang) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include a lang attribute to provide the page's language.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckATags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for href attribute when using "a" tag
  if (element.name !== "a") return [];
  if (!element.attribs.href) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Include an href attribute to make text a hyperlink.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckTitleTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for title tag when using head tag
  if (element.name !== "head") return [];
  let containsTitle = 0;
  const range = GetStartTagPosition(element);
  if (!range) return [];
  const children = $(element).children();
  for (let child of children) {
    if (child.name === "title") {
      containsTitle = 1;
    }
  }
  if (containsTitle === 0) {
    return [
      {
        code: "",
        message: "Include a title for each page.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckTableTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for captions for table
  if (element.name !== "table") return [];
  let containsCaption = 0;
  const range = GetStartTagPosition(element);
  if (!range) return [];
  const children = $(element).children();
  for (let child of children) {
    if (child.name === "caption") {
      containsCaption = 1;
    }
  }
  if (containsCaption === 0) {
    return [
      {
        code: "",
        message: "Include a caption for each table.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckOneH1Tag($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "h1") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  if ($("h1").length > 1) {
    return [
      {
        code: "",
        message: "There should only be one <h1> per page. Consider using <h2>-<h4> instead.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckHeadingOrder($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "h1" &&
    element.name !== "h2" &&
    element.name !== "h3" &&
    element.name !== "h4" &&
    element.name !== "h5" &&
    element.name !== "h6"
  )
    return [];
  const range = GetStartTagPosition(element);
  const errors: Diagnostic[] = [];
  if (!range) return [];
  const genericError = {
    code: "",
    message: "Headings are out of order - place more important headings before less important ones.",
    range: range,
    severity: DiagnosticSeverity.Error,
    source: "Accessibility Checker",
  };
  if (element.name === "h1") {
    $("h2").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h3").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h4").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h5").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h6").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
  }
  if (element.name === "h2") {
    $("h3").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h4").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h5").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h6").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
  }
  if (element.name === "h3") {
    $("h4").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h5").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h6").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
  }
  if (element.name === "h4") {
    $("h5").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
    $("h6").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
  }
  if (element.name === "h5") {
    $("h6").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
  }
  return errors;
}

function GetStartTagPosition(element: Element): Range | undefined {
  const location = element.sourceCodeLocation;
  if (!location || !location.startTag) {
    console.log("No tag location");
    return undefined;
  }
  return new Range(
    new Position(location.startTag.startLine - 1, location.startTag.startCol - 1),
    new Position(location.startTag.endLine - 1, location.startTag.endCol - 1)
  );
}

function IsTagOutOfOrder(element: Element, range: Range): boolean | undefined {
  const h2Range = GetStartTagPosition(element);
  if (!h2Range) return;
  if (h2Range.start.isBefore(range.start)) {
    //H2 tag starts before the H1 tag
    return true;
  }
  return false;
}
