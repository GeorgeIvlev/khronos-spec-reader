import { useLayoutEffect } from 'react';

import * as ace from 'ace-builds';
// Import theme and mode (required)
import 'ace-builds/src-noconflict/theme-chrome';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/keybinding-vim';

ace.config.set('basePath', '/');

const Editor = () => {
  useLayoutEffect(() => {
    let editor = ace.edit('editor-element-id');
    editor.session.setUseWorker(true);
    editor.setKeyboardHandler('ace/keyboard/vim');
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

    editor.focus();
  });

  return <div id="editor-element-id"></div>;
};

export default Editor;
