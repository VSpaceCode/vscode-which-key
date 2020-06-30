import { QuickPickItem } from 'vscode';
import KeyListener from '../keyListener';

export interface MenuItem extends QuickPickItem {
  key: string;
  action: (keyWatch: KeyListener) => Thenable<unknown>;
}