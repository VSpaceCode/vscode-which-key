import { QuickPickItem } from 'vscode';

export interface MenuItem extends QuickPickItem {
  key: string;
  action: () => Thenable<unknown>;
}