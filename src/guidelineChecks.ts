import { CheerioAPI, Element } from "cheerio";
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";
import { Configuration } from "./util";
import { by639_1 } from "iso-language-codes";

export const GuidelineList = [
  CheckHTMLTags,
  CheckLangRecognize,
  CheckImageTags,
  CheckImageAnchorTags,
  CheckATags,
  CheckAnchorText,
  CheckHeading,
  CheckTitleTags,
  CheckTitleText,
  CheckTableTags,
  CheckOneH1Tag,
  CheckHeadingOrder,
  CheckVideoAndAudioTags,
  CheckButtons,
  CheckInputButtons,
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
  CheckFormTags,
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

function CheckImageTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "img" ||
    !Configuration.GetInstance().get()["perceivable"]["textAlternatives"][
      "img element missing alt attribute"
    ]
  )
    return [];
  //Check for an alt attribute on each img
  if (!element.attribs.alt) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "1.1.1",
        message: "Include an alt attribute on every image",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckImageAnchorTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "a" ||
    !Configuration.GetInstance().get()["perceivable"]["textAlternatives"][
      "Image used as anchor is missing valid Alt text."
    ]
  )
    return [];
  let containsImage = 0;
  let imgHasAlt = 0;
  let imgChild = element;
  //Checking if an image is used for the anchor
  const children = $(element).children();
  for (let child of children) {
    if (child.name === "img") {
      containsImage = 1;
      if(child.attribs.alt){
        imgHasAlt = 1;
      }
      imgChild = child;
    }
  }
  if (containsImage && imgHasAlt === 0) {
    const range = GetStartTagPosition(imgChild);
    if (!range) return [];
    return [
      {
        code: "1.1.1",
        message: "Image used as anchor should have Alt text.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckHTMLTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "html" ||
    !Configuration.GetInstance().get()["understandable"]["readable"]["document language not identified"]
  )
    return [];
  //Check for lang attribute when using html tag
  if (!element.attribs.lang) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "3.1.1",
        message: "Include a lang attribute to provide the page's language.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckLangRecognize($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "html" ||
    !Configuration.GetInstance().get()["understandable"]["readable"]["document has invalid language code"]
  )
    return [];
  //Check for lang attribute when using html tag
  if (!element.attribs.lang) return [];

  if (!Object.keys(by639_1).includes(element.attribs.lang.toString())) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "3.1.1",
        message: "Language is not recognized by HTML.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckATags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for href attribute when using "a" tag
  if (
    element.name !== "a" ||
    !Configuration.GetInstance().get()["operable"]["navigable"]["Include an href attribute to make text a hyperlink"]
  )
    return [];
  if (!element.attribs.href) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "1.3.1",
        message: "Include an href attribute to make text a hyperlink.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckAnchorText($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for href attribute when using "a" tag
  if (element.name !== "a" || !Configuration.GetInstance().get()["operable"]["navigable"]["Anchor contains no text."])
    return [];

  let foundText = false;
  $(element)
    .contents()
    .each((i, e) => {
      if (e.type === "text") {
        foundText = true;
      } else if(e.type === "tag"){
        if(e.name === "img"){
          foundText = true;
        }
      }
    });
  if (!foundText) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.4.4",
        message: "Anchor tags should have associated text.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckTitleTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for title tag when using head tag
  if (
    element.name !== "head" ||
    !Configuration.GetInstance().get()["operable"]["navigable"]["Document missing title element"]
  )
    return [];
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
        code: "2.4.2",
        message: "Include a title for each page.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckTitleText($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "title" || !Configuration.GetInstance().get()["operable"]["navigable"]["title element is empty"])
    return [];

  let foundText = false;
  $(element)
    .contents()
    .each((i, e) => {
      if (e.type === "text") {
        foundText = true;
      }
    });
  if (!foundText) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.4.2",
        message: "Titles should have associated text.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckHeading($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "h1" && element.name !== "h2" && element.name !== "h3" && element.name !== "h4" && element.name !== "h5" && element.name !== "h6"
  )
    return [];
    let foundText = false;
    $(element)
      .contents()
      .each((i, e) => {
        if (e.type === "text") {
          foundText = true;
        } else if(e.type === "tag"){
          if(e.name === "img"){
            foundText = true;
          }
        }
      });
    if (!foundText) {
      const range = GetStartTagPosition(element);
      if (!range) return [];
      return [
        {
          code: "2.4.6",
          message: "Heading tags should have associated text or image.",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        },
      ];
    }
    return [];
}

function CheckTableTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for captions for table
  if (
    element.name !== "table" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"]["Include a caption for each table."]
  )
    return [];
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
        code: "2.4.6",
        message: "Include a caption for each table.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckOneH1Tag($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "h1" ||
    !Configuration.GetInstance().get()["operable"]["navigable"]["There should only be one <h1> per page"]
  )
    return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  if ($("h1").length > 1) {
    return [
      {
        code: "2.4.6",
        message: "There should only be one <h1> per page. Consider using <h2>-<h4> instead.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckHeadingOrder($: CheerioAPI, element: Element): Diagnostic[] {
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
    code: "2.4.6",
    message: "Headings are out of order - place more important headings before less important ones.",
    range: range,
    severity: DiagnosticSeverity.Error,
    source: "Accessibility Checker",
  };
  if (
    element.name === "h1" &&
    Configuration.GetInstance().get()["operable"]["navigable"]["Header nesting - header following h1 is incorrect."]
  ) {
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
  if (
    element.name === "h2" &&
    Configuration.GetInstance().get()["operable"]["navigable"]["Header nesting - header following h2 is incorrect."]
  ) {
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
  if (
    element.name === "h3" &&
    Configuration.GetInstance().get()["operable"]["navigable"]["Header nesting - header following h3 is incorrect."]
  ) {
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
  if (
    element.name === "h4" &&
    Configuration.GetInstance().get()["operable"]["navigable"]["Header nesting - header following h4 is incorrect."]
  ) {
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
  if (
    element.name === "h5" &&
    Configuration.GetInstance().get()["operable"]["navigable"]["Header nesting - header following h5 is incorrect."]
  ) {
    $("h6").each((i, el) => {
      if (IsTagOutOfOrder(el, range)) {
        errors.push(genericError);
      }
    });
  }
  return errors;
}

//TODO: Controls only necessary if autoplay is enabled
function CheckVideoAndAudioTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    (element.name !== "video" && element.name !== "audio") ||
    !Configuration.GetInstance().get()["perceivable"]["distinguishable"][
      "Video and audio tags should have control attribute for pausing and volume"
    ]
  )
    return [];
  if (element.attribs.controls === undefined) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.1.1",
        message: "Video and audio tags should have control attribute for pausing and volume",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckButtons($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "button" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"]["Empty Button"]
  )
    return [];
  let foundText = false;
  $(element)
    .contents()
    .each((i, e) => {
      if (e.type === "text") {
        foundText = true;
      }
    });
  if (!foundText) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.4.4",
        message: "Place text content within the <button> element.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckInputButtons($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "input" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"]["Empty Button"]
  )
    return [];
  
  if ((element.attribs.type == "submit" || element.attribs.type == "button" || element.attribs.type == "reset") && !element.attribs.value) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.4.4",
        message: "Give input element a value attribute.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

//TODO: Add settings for multiple labels. Currently only have settings for missing labels
function CheckInput($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "input") return [];

  if (
    element.attribs.type === "text" ||
    element.attribs.type === "password" ||
    element.attribs.type === "radio" ||
    element.attribs.type === "checkbox" ||
    element.attribs.type === "file"
  ) {
    let elementID = element.attribs.id;
    let foundLabel = 0;
    $("label").each((i, e) => {
      if (e.attribs.for === elementID) {
        foundLabel++;
      }
    });
    if (!foundLabel) {
      const range = GetStartTagPosition(element);
      if (
        !range ||
        (element.attribs.type === "text" &&
          !Configuration.GetInstance().get()["perceivable"]["adaptable"][
            "input element, type of 'text', missing an associated label."
          ]) ||
        (element.attribs.type === "password" &&
          !Configuration.GetInstance().get()["perceivable"]["adaptable"][
            "input element, type of 'password', missing an associated label."
          ]) ||
        (element.attribs.type === "radio" &&
          !Configuration.GetInstance().get()["perceivable"]["adaptable"][
            "input element, type of 'radio', missing an associated label."
          ]) ||
        (element.attribs.type === "checkbox" &&
          !Configuration.GetInstance().get()["perceivable"]["adaptable"][
            "input element, type of 'checkbox', missing an associated label."
          ]) ||
        (element.attribs.type === "file" &&
          !Configuration.GetInstance().get()["perceivable"]["adaptable"][
            "input element, type of 'file', missing an associated label."
          ])
      )
        return [];
      return [
        {
          code: "1.3.1",
          message:
            'Always use the <label> tag to define labels for <input type="text">, <input type="checkbox">, <input type="radio">, <input type="file">, and <input type="password">.',
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        },
      ];
    }
  }
  return [];
}

function CheckMultipleInputLabels($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "input" ||
    !Configuration.GetInstance().get()["understandable"]["inputAssistance"][
      "input element has more than one associated label"
    ]
  )
    return [];
  if (
    element.attribs.type === "text" ||
    element.attribs.type === "password" ||
    element.attribs.type === "radio" ||
    element.attribs.type === "checkbox" ||
    element.attribs.type === "file"
  ) {
    let elementID = element.attribs.id;
    let foundLabel = 0;
    $("label").each((i, e) => {
      if (e.attribs.for === elementID) {
        foundLabel++;
      }
    });
    if (!foundLabel) return [];
    else if (foundLabel > 1) {
      const range = GetStartTagPosition(element);
      if (!range) return [];
      return [
        {
          code: "3.2.2",
          message: "Input elements should only have one associated label.",
          range: range,
          severity: DiagnosticSeverity.Error,
          source: "Accessibility Checker",
        },
      ];
    }
  }
  return [];
}

//TODO: Figure out what guideline this should be for
function CheckInputAlt($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "input" ||
    !element.attribs.type ||
    element.attribs.type === "image" ||
    !Configuration.GetInstance().get()["perceivable"]["textAlternatives"]["input element has alt attribute"]
  )
    return [];
  const range = GetStartTagPosition(element);
  if (element.attribs.alt) {
    if (!range) return [];
    return [
      {
        code: "1.1.1",
        message: "Input elements should not an alt attribute unless it is of type 'image'.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

//TODO: Remove extra configuration properties for 'no text' in each of the input types
function CheckLabel($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "label" ||
    !Configuration.GetInstance().get()["understandable"]["inputAssistance"]["label text is empty"]
  )
    return [];
  let foundText = false;
  $(element)
    .contents()
    .each((i, e) => {
      if (e.type === "text") {
        foundText = true;
      }
    });
  if (!foundText) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "1.3.1",
        message: "Labels should have associated text.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckID($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    !element.attribs ||
    !element.attribs.id ||
    !Configuration.GetInstance().get()["robust"]["compatible"]["id attribute is not unique"]
  )
    return [];

  let ID = element.attribs.id;
  let foundID = 0;
  $("[id]").each((i, e) => {
    if (e.attribs.id === ID) {
      foundID++;
    }
  });

  if (foundID > 1) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "4.1.1",
        message: "IDs must be unique",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckOnMouseLeave($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    !element.attribs ||
    !element.attribs.onmouseleave ||
    !Configuration.GetInstance().get()["operable"]["keyboardAccessible"][
      "script not keyboard accessible - onmouse missing onblur"
    ]
  )
    return [];

  if (!element.attribs.onblur) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.1.1",
        message: "onmouseleave is missing onblur attribute",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckOnMouseOut($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    !element.attribs ||
    !element.attribs.onmouseout ||
    !Configuration.GetInstance().get()["operable"]["keyboardAccessible"][
      "script not keyboard accessible - onmouse missing onblur"
    ]
  )
    return [];

  if (!element.attribs.onblur) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.1.1",
        message: "onmouseout is missing onblur attribute",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckOnMouseOver($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    !element.attribs ||
    !element.attribs.onmouseover ||
    !Configuration.GetInstance().get()["operable"]["keyboardAccessible"][
      "onmouseover event handler missing onfocus event handler"
    ]
  )
    return [];

  if (!element.attribs.onfocus) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.1.1",
        message: "onmouseover is missing onfocus attribute",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckOnMouseDown($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    !element.attribs ||
    !element.attribs.onmousedown ||
    !Configuration.GetInstance().get()["operable"]["keyboardAccessible"]["onmousedown event missing onkeydown event"]
  )
    return [];

  if (!element.attribs.onkeydown) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.1.1",
        message: "onmousedown is missing onkeydown attribute",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckSelectTag($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "select" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"]["select element missing an associated label."]
  )
    return [];

  let elementID = element.attribs.id;
  let foundLabel = 0;
  $("label").each((i, e) => {
    if (e.attribs.for === elementID) {
      foundLabel++;
    }
  });
  if (!foundLabel) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "1.3.1",
        message: "Select elements should have an associated label.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckSelectTagLabels($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "select" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"][
      "Select elements should only have one associated label"
    ]
  )
    return [];

  let elementID = element.attribs.id;
  let foundLabel = 0;
  $("label").each((i, e) => {
    if (e.attribs.for === elementID) {
      foundLabel++;
    }
  });
  if (foundLabel > 1) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "3.3.2",
        message: "Select elements should only have one associated label.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckFormTags($: CheerioAPI, element: Element): Diagnostic[] {
  //Check for fieldset within form
  if (element.name !== "form") return [];
  let containsFieldset = 0;
  let containsLegend = 0;
  let radioCount = 0;
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
    } else if(child.name === 'legend') containsLegend++;
    else if(child.name === 'p'){
      const pChildren = $(child).children();
      for(let pChild of pChildren){
        if(pChild.name === "input" && pChild.attribs.type === "radio"){
          radioCount += 1;
        }
      }
    }
  }
  if(containsFieldset === 0 && radioCount > 1){
    return [
      {
        code: "1.3.1",
        message: "Forms with multiple radio buttons shoud use fieldset and legend to group them.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  else if(containsFieldset === 1 && containsLegend === 0){
    return [
      {
        code: "1.3.1",
        message: "Forms with fieldset should have a legend",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  else if(containsFieldset == 0 && containsLegend == 1){
    return [
      {
        code: "1.3.1",
        message: "The legend tag should only be used with a fieldset element",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckTextAreaTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "textarea" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"]["textarea element missing an associated label."]
  )
    return [];

  let elementID = element.attribs.id;
  let foundLabel = 0;
  $("label").each((i, e) => {
    if (e.attribs.for === elementID) {
      foundLabel++;
    }
  });
  if (!foundLabel) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "1.3.1",
        message: "Textarea tags should have an associated label",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }
  return [];
}

function CheckTextAreaTagLabels($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "textarea" ||
    !Configuration.GetInstance().get()["perceivable"]["adaptable"][
      "Textarea elements should only have one associated label"
    ]
  )
    return [];

  let elementID = element.attribs.id;
  let foundLabel = 0;
  $("label").each((i, e) => {
    if (e.attribs.for === elementID) {
      foundLabel++;
    }
  });
  if (foundLabel > 1) {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "3.3.2",
        message: "Textarea elements should only have one associated label.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckMarqueeTags($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "marquee" ||
    !Configuration.GetInstance().get()["operable"]["enoughTime"]["Marquee element used"]
  )
    return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "2.2.2",
      message: "The <marquee> tag is depreciated, use CSS animation or transform properties instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForMetaTimeout($: CheerioAPI, element: Element): Diagnostic[] {
  if (
    element.name !== "meta" ||
    !Configuration.GetInstance().get()["operable"]["enoughTime"]["Meta refresh with a time-out is used"]
  )
    return [];
  if (!element.attribs["http-equiv"]) return [];
  if (element.attribs["http-equiv"] == "refresh") {
    const range = GetStartTagPosition(element);
    if (!range) return [];
    return [
      {
        code: "2.2.1",
        message: "Using a meta refresh with a timeout is not considered in line with best accessibility practices.",
        range: range,
        severity: DiagnosticSeverity.Error,
        source: "Accessibility Checker",
      },
    ];
  }

  return [];
}

function CheckForAcronym($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "acronym") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<acronym> tag is depreciated, use <abbr> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForApplet($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "applet") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<applet> tag is depreciated, use <object> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForBasefront($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "basefront") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<basefront> tag is depreciated.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForBig($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "big") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<big> tag is depreciated, use CSS Styles instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForBlink($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "blink") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "2.2.2",
      message: "<blink> tag is depreciated, consider using CSS Animation instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForCenter($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "center") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<center> tag is depreciated, use CSS text-align property instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForDir($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "dir") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<dir> tag is depreciated, use <ul> tag or CSS list-style property instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForEmbed($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "embed") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<embed> tag is depreciated, use <object> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForFont($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "font") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "1.4.4",
      message: "<font> tag is depreciated, use CSS styles instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForFrame($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "frame") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<frame> tag is depreciated, use <iframe> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForFrameset($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "frameset") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<frameset> tag is depreciated.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForIsIndex($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "isindex") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<isindex> tag is depreciated, use <form> tag instead",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForNoFrames($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "noframes") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<noframes> tag is depreciated.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForMenu($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "menu") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<menu> tag is depreciated, use <ul> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForPlaintext($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "plaintext") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<plaintext> tag is depreciated, use <pre> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForS($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "s") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<s> tag is depreciated, use CSS text-decoration instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForStrike($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "strike") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<strike> tag is depreciated, use <del> tag instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForTt($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "tt") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<tt> tag is depreciated.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForU($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "u") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "<u> tag is depreciated, use CSS text-decoration property instead.",
      range: range,
      severity: DiagnosticSeverity.Error,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForItalic($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "i") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "Consider using the <em> tag instead of <i>, as it provides information for screen readers.",
      range: range,
      severity: DiagnosticSeverity.Warning,
      source: "Accessibility Checker",
    },
  ];

  return [];
}

function CheckForBold($: CheerioAPI, element: Element): Diagnostic[] {
  if (element.name !== "b") return [];
  const range = GetStartTagPosition(element);
  if (!range) return [];
  return [
    {
      code: "",
      message: "Consider using the <strong> tag instead of <b>, as it provides information for screen readers.",
      range: range,
      severity: DiagnosticSeverity.Warning,
      source: "Accessibility Checker",
    },
  ];

  return [];
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
