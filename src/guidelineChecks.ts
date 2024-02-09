import { Cheerio, CheerioAPI, Element, AnyNode } from "cheerio";
import * as cheerio from "cheerio";
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";
import { isElement } from "./util";
import { isText } from "domhandler";
import {by639_1} from "iso-language-codes";

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

  if(!(Object.keys(by639_1).includes(element.attribs.lang.toString()))){

    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Language is not recognized by HTML.",
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
  let foundText = false;
  $(element).contents().each((i,e) => {
    if(e.type === 'text'){
      foundText = true;
    }
  });
  if (!foundText) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "",
        message: "Anchor tags should have associated text.",
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

export function CheckTitleText($: CheerioAPI, element: Element): Diagnostic[] {
  if(element.name !== 'title') return [];

  let foundText = false;
  $(element).contents().each((i,e) => {
    if(e.type === 'text'){
      foundText = true;
    }
  });
  if(!foundText){
    const range = GetStartTagPosition(element);
    if(!range) return [];
    return [
      {
        code: "",
        message: "Titles should have associated text.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      }
    ]
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

export function CheckVideoAndAudioTags($: CheerioAPI, element: Element): Diagnostic[] {
  if(element.name !== "video" && element.name !== "audio") return [];
  if(element.attribs.controls === undefined){
    const range = GetStartTagPosition(element);
    if(!range) return [];
    return [
      {
        code: "",
        message: "Video and audio tags should have control attribute for pausing and volume",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

export function CheckButtons($: CheerioAPI, element: Element): Diagnostic[] {
  if(element.name !== 'button') return [];
  if(element.attribs.type !== 'button'){
    const range = GetStartTagPosition(element);
    if(!range) return [];
    return [
      {
        code: "",
        message: "Buttons should have button type",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      }
    ]
  }
  return [];
}

export function CheckInput($: CheerioAPI, element: Element): Diagnostic[] {
  if(element.name !== 'input') return [];
  if(element.attribs.type === 'text' || 
    element.attribs.type === 'password' || 
    element.attribs.type === 'radio' ||
    element.attribs.type === 'checkbox' ||
    element.attribs.type === 'file'){

    let elementID = element.attribs.id;
    let foundLabel = 0;
    $('label').each((i, e) => {
      if(e.attribs.for === elementID){
        foundLabel++;
      }
    });
    if(!foundLabel){
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "Always use the <label> tag to define labels for <input type=\"text\">, <input type=\"checkbox\">, <input type=\"radio\">, <input type=\"file\">, and <input type=\"password\">.",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
    else if(foundLabel > 1){
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "Input elements should only have one associated label.",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
  }
  return [];


}

export function CheckLabel($: CheerioAPI, element: Element): Diagnostic[] {
  if(element.name !== 'label') return [];
  let foundText = false;
  $(element).contents().each((i,e) => {
    if(e.type === 'text'){
      foundText = true;
    }
  });
  if(!foundText){
    const range = GetStartTagPosition(element);
    if(!range) return [];
    return [
      {
        code: "",
        message: "Labels should have associated text.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      }
    ]
  }
  return [];
}

export function CheckID($: CheerioAPI, element: Element): Diagnostic[] {
  if(!element.attribs) return [];
  if(!element.attribs.id) return [];

  let ID = element.attribs.id;
  let foundID = 0;
  $('[id]').each((i, e) => {
    if(e.attribs.id === ID){
      foundID++;
    }
  });

  if(foundID > 1){
    const range = GetStartTagPosition(element);
    if(!range) return [];
    return [
      {
        code: "",
        message: "IDs must be unique",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      }
    ]
  } 
  return [];
}

export function CheckOnMouseLeave($: CheerioAPI, element: Element): Diagnostic[] {
  if(!element.attribs) return [];
  if(!element.attribs.onmouseleave) return [];
  
  if(!element.attribs.onblur) {
    const range = GetStartTagPosition(element);
    if(!range) return [];
    return [
      {
        code: "",
        message: "onmouse is missing onblur attribute",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      }
    ]
  }
  
  return [];
}

export function CheckOnMouse($: CheerioAPI, element: Element): Diagnostic[] {
  if(!element.attribs) return [];
  if(!(element.attribs.onmouseout || element.attribs.onmouseover || element.attribs.onmousedown)) return [];

  if(element.attribs.onmouseout){
    if(!element.attribs.onblur) {
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "onmouseout is missing onblur attribute",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
  }
  else if(element.attribs.onmouseover){
    if(!element.attribs.onfocus) {
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "onmouseover is missing onfocus attribute",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
  }
  else if(element.attribs.onmousedown){
    if(!element.attribs.onkeydown) {
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "onmousedown is missing onkeydown attribute",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
  }
  
  return [];
}

export function CheckSelectTag($: CheerioAPI, element: Element): Diagnostic[] {
  if(element.name !== 'select') return [];

  let elementID = element.attribs.id;
    let foundLabel = 0;
    $('label').each((i, e) => {
      if(e.attribs.for === elementID){
        foundLabel++;
      }
    });
    if(!foundLabel){
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "Select elements should have an associated label.",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
    else if(foundLabel > 1){
      const range = GetStartTagPosition(element);
      if(!range) return [];
      return [
        {
          code: "",
          message: "Select elements should only have one associated label.",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        }
      ]
    }
  return [];
}

/*
export function CheckFormTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for title tag when using head tag
  if (element.name !== "form") return [];
  let containsFieldset = 0;
  let containsLegend = 0;
  const range = GetStartTagPosition(element);
  if (!range) return [];
  const children = $(element).children();
  for (let child of children) {
    if (child.name === "fieldset") {
      containsFieldset++;
      const fieldChildren = $(child).children();
      for(let newChild of fieldChildren) {
        if(newChild.name === 'legend') containsLegend++;
      }
    }
    else if(child.name === 'legend') containsLegend++;
  }
  if (containsFieldset === 0 && containsLegend == 0) {
    return [
      {
        code: "",
        message: "Forms should have a fieldset and a legend",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  else if(containsFieldset == 1 && containsLegend == 0){
    return [
      {
        code: "",
        message: "Forms should have a legend",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  else if(containsFieldset == 0 && containsLegend == 1){
    return [
      {
        code: "",
        message: "Forms should have a fieldset",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}
*/

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
