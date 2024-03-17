import * as fs from "fs";
import { Uri } from "vscode";

type Props = {
  stylesPath: Uri;
  scriptsPath: Uri;
  viewPath: string;
};

export default function GenerateReportContent({ viewPath, stylesPath, scriptsPath, ...props }: Props) {
  const html = fs.readFileSync(viewPath).toString();
  return eval(`\`${html}\``);
}
