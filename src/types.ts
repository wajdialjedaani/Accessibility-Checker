import { Diagnostic } from "vscode";

export type FileDiagnostics = {
  title: string;
  path: string;
  diagnostics: Diagnostic[];
};

export type FileStats = {
  title: string;
  path: string;
  statistics: Results;
};

export type Results = {
  guidelines: string[];
  tallies: number[];
  amount: string[];
  messages: string[];
};
