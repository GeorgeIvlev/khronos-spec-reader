import { useEffect, useLayoutEffect } from 'react';

import * as ace from 'ace-builds';
// Import theme and mode (required)
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/keybinding-vim';

import { processShortcuts } from './shortcuts';
import '../../services/FileSystemManager';
import { EventManager } from '../../services/EventManager';

ace.config.set('basePath', '/');

const Editor = () => {
  useLayoutEffect(() => {
    let editor = ace.edit('editor-element-id');
    editor.session.setUseWorker(true);
    // editor.setKeyboardHandler("ace/keyboard/emacs");
    // editor.setKeyboardHandler(null); // Back to default
    // Default options
    editor.setOptions({
      theme: 'ace/theme/chrome',
      mode: 'ace/mode/c_cpp',
      fontFamily: 'Agave',
      fontSize: 15,
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: false,
      enableLiveAutocompletion: false,
      enableSnippets: false,
      wrap: true,
      tabSize: 2,
      useSoftTabs: true,
    });

    editor.setKeyboardHandler('ace/keyboard/vim');

    var VimApi = ace.require('ace/keyboard/vim').Vim;

    console.log('VimApi:', VimApi);

    VimApi.defineEx('open', 'o', function (cm, input) {
      console.log(':o triggered!', input.args);
      EventManager.emit('open-file', input.args[0]);
    });

    VimApi.defineEx('write', 'w', function (cm, input) {
      console.log(':w triggered!', input);

      // Get editor content
      const content = editor.getValue();
      const filePath = (window as any).__CURRENT_FILE_PATH__ || 'untitled';

      // Your save logic here
      console.log('Saving file:', filePath);
      console.log('Content:', content);
      console.log('Content length:', content.length);
    });
    VimApi.defineEx('mycommand', 'my', function (cm, input) {
      console.log('My command!');
    });

    // ace.config.loadModule('ace/keybinding/vim', function () {
    //   const Vim = ace.require('ace/keyboard/vim').Vim;
    //   Vim.map(':w', 'javascript:myCustomSaveFunction()', 'normal');

    //   // CORRECT: Define Ex command :w and :write
    //   Vim.defineEx('write', 'w', function (cm: any, input: any) {
    //     console.log(':w triggered!', input);

    //     // Call Tauri or your save function
    //     // saveFile(filePath, content);

    //     // Show success in Vim command line
    //     cm.openNotification(`"${filePath}" ${content.length}L written`, {
    //       bottom: true,
    //       duration: 3000,
    //     });
    //   });

    //   // Optional: Map Ctrl+S to :w in normal mode
    //   Vim.map('<C-s>', ':w<CR>', 'normal');
    // });

    editor.focus();
    processShortcuts(editor);
  });

  useEffect(() => {
    return () => {
      // EventManager.off('open-file');
    };
  }, []);

  return <div id="editor-element-id"></div>;
};

export default Editor;
