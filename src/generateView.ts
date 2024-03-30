import * as fs from "fs";
import { Uri } from "vscode";

type Props =
  | {
      type: "webview";
      stylesPath: Uri;
      scriptsPath: Uri;
      viewPath: string;
    }
  | {
      type: "file";
      stylesPaths: Uri[];
      scriptsPaths: Uri[];
      viewPath: string;
      data: string;
    };

export default function GenerateReportContent(props: Props) {
  if (props.type === "webview") {
    const { stylesPath, scriptsPath } = props;
    const html = fs.readFileSync(props.viewPath).toString();
    return eval(`\`${html}\``);
  } else if (props.type === "file") {
    const scriptPattern = /<script.*src="\${scriptsPath}".*<\/script>/m;
    const linkPattern = /<link.*href="\${stylesPath}".*>/m;
    const bundledJS = props.scriptsPaths.reduce((jsString, path) => {
      return jsString + `<script>${fs.readFileSync(path.fsPath).toString()}</script>\n`;
    }, `<script>const data=${props.data}</script>\n`);

    //Append each css file to a single string
    const bundledCSS = props.stylesPaths.reduce((cssString, path) => {
      return cssString + fs.readFileSync(path.fsPath).toString();
    }, "");

    let html = fs.readFileSync(props.viewPath).toString();
    html = html.replace(linkPattern, `<style>${bundledCSS}</style>`);
    html = html.replace(scriptPattern, bundledJS);
    return html;
  }
}
