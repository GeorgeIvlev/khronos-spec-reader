import * as ace from 'ace-builds';

import EventManager from '@services/EventManager';
import { execCommand } from '@services/CommandManager';
import DialogManager from '@services/DialogManager';

const dialog = new DialogManager();

export const processShortcuts = (editor: ace.Ace.Editor) => {
  editor.commands.addCommand({
    name: 'openFile',
    bindKey: { win: 'Ctrl-O', mac: 'Command-O' },
    exec: function (editor) {
      // console.log('Open file shortcut triggered');
      return true;
    },
  });
  editor.commands.addCommand({
    name: 'newFile',
    bindKey: { win: 'Ctrl-N', mac: 'Command-N' },
    exec: function (editor) {
      // console.log('New file shortcut triggered');
      return true;
    },
  });
  editor.commands.addCommand({
    name: 'findContentInFile',
    bindKey: { win: 'Ctrl-Shift-F', mac: 'Command-Shift-F' },
    exec: function (editor) {
      // console.log('Find content in file shortcut triggered');
      EventManager.emit('file-content-search');
      return true;
    },
  });

  editor.commands.addCommand({
    name: 'changeSession',
    bindKey: { win: 'Ctrl-Shift-Tab', mac: 'Command-Shift-Tab' },
    exec: function (editor) {
      // console.log('[COMMAND] changeSession triggered');
      EventManager.emit('editor-change-session');
      return true;
    },
  });

  editor.commands.addCommand({
    name: 'buildProject',
    bindKey: { win: 'Ctrl-B', mac: 'Command-B' },
    exec: function (editor) {
      console.log('Build project shortcut triggered');
      // EventManager.emit('build-project')

      // Configure project
      // cmake --preset windows-debug

      // Clean configure
      // cmake --fresh --preset windows-debug

      // Build preset
      // cmake --build

      // execCommand(
      //   `cmake -S ${localStorage.getItem('current-folder')} --list-presets=all`,
      // )

      // execCommand(
      //   `cmake -S ${localStorage.getItem('current-folder')} --preset windows-debug`,
      // )

      // execCommand(
      //   `cmake -S ${localStorage.getItem('current-folder')} --fresh --preset windows-debug`,
      // )

      // execCommand(
      //   `cmake --build ${localStorage.getItem('current-folder')}/out/build/`,
      // )
      // execCommand(`F:\\MyProjects\\gui-lib\\bin\\simple-ui.exe`)
      // execCommand(`type F:\\MyProjects\\gui-lib\\CMakePresets.json`)
      return true;
    },
  });
};

// Usage in your handler
export const cmakeImplHandle = (cm: any, data: { input: string; args: string[] }) => {};

export const onOpenHandle = (_: void, input: { args: string[] }) => {
  if (!Object.hasOwn(input, 'args')) {
    dialog.openDialog({ directory: true }).then((path) => {
      console.log('file path selected! ', path);
      if (!path) return;

      // EventManager.emit('open-folder', path);
      EventManager.emit('open-folder-success', path);
    });
    return;
  }

  if (input.args[0]) {
    tmpPath = input.args[0];
    EventManager.emit('open-file', input.args[0]);
  }
};

export const onWriteHandle = (context: any, input: { args: string[] }) => {
  // Get editor content
  console.log('context: ', context.ace.sessionId);
  const content = context.ace.getValue();
  let filePath = input.args[0];
  // Your save logic here
  if (!filePath) return;

  console.log('Saving file:', filePath);
  EventManager.emit('write-file', { content, path: filePath });
};

export default processShortcuts;
