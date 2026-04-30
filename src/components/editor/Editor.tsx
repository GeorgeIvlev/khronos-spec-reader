// import { useEffect, useLayoutEffect } from 'react';

import * as ace from 'ace-builds';

import 'ace-builds/src-noconflict/theme-gruvbox';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/keybinding-vim';

import { processShortcuts, cmakeImplHandle, onOpenHandle, onWriteHandle } from './shortcuts';
import EventManager from '@services/EventManager';
import SessionManager from '@components/editor/SessionManager';
// import ClangdClient from './Lsp'

import './editor.scss';

ace.config.set('basePath', '/');

let editor: ace.Ace.Editor;
// const clangd = ClangdClient

const sessions = new SessionManager();

function splitPath(path) {
  // Normalize separators (handle both / and \), remove trailing slashes
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash === -1) return { dir: '', file: normalized };
  if (lastSlash === 0) return { dir: '/', file: normalized.slice(1) };

  return {
    dir: normalized.slice(0, lastSlash), // "/examples/simple_ui"
    file: normalized.slice(lastSlash + 1), // "main.cpp"
  };
}

const Editor = () => {
  useLayoutEffect(() => {
    editor = ace.edit('editor-element-id');
    editor.session.setUseWorker(true);
    editor.setOptions({
      mode: 'ace/mode/c_cpp',
      fontFamily: 'Agave',
      fontSize: 16,
      showPrintMargin: true,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: false,
      enableLiveAutocompletion: false,
      enableSnippets: false,
      wrap: true,
      tabSize: 2,
      useSoftTabs: true,
      readOnly: false,
    });

    editor.setKeyboardHandler('ace/keyboard/vim');
    var VimApi = ace.require('ace/keyboard/vim').Vim;

    VimApi.defineEx('open', 'o', onOpenHandle);
    VimApi.defineEx('write', 'w', onWriteHandle);
    VimApi.defineEx('cmake', '', cmakeImplHandle);

    VimApi.defineEx('mycommand', 'my', async (cm, input) => {
      console.log('My command!');
      //       await clangd.send({
      //         type: 'didOpen',
      //         uri: 'file:///C:/Users/georg/CLionProjects/test_webview/main.cpp',  // 3 slashes!
      //         language_id: 'cpp',
      //         text: `struct B {
      //     float z;
      // };
      // struct A {
      //     int x;
      //     int y;
      //     B z;
      // };
      // int main() {
      //     A v;
      //     v.x = 0;
      //     v.
      //     return 0;
      // }`
      //       })
      // await clangd.send({
      //   type: 'completion',
      //   uri: 'file:///C:/Users/georg/CLionProjects/test_webview/main.cpp',  // Same URI!
      //   line: 13,
      //   character: 7
      // });
    });

    processShortcuts(editor);
    editor.focus();
  });

  useEffect(() => {
    EventManager.on('open-folder-success', (path: string) => {
      localStorage['current-folder'] = path;
    });

    EventManager.on('open-file-success', () => {
      // @ts-ignore
      const sessionContent = new TextDecoder().decode(window.__FILE_CONTENT__);
      // @ts-ignore
      const editorSession = ace.createEditSession(sessionContent, 'ace/mode/c_cpp');

      const { file, dir } = splitPath(window.__FILE_PATH__);
      console.log(file, dir);

      const session = sessions.createSession(editorSession, file, window.__FILE_PATH__);
      if (session) {
        document.getElementById('editor--session-name').innerText = session.filename;
        editor.setSession(session.editSession);
        editor.sessionId = session.id;
      }
    });

    EventManager.on('editor-change-session', () => {
      const session = sessions.nextSession();
      console.log('session: ', session);
      if (session) {
        document.getElementById('editor--session-name').innerText = session.filename;
        editor.setSession(session.editSession);
        editor.sessionId = session.id;
      }
    });

    return () => {
      // clangd.stop();
      EventManager.off('open-file');
    };
  }, []);

  return (
    <>
      <div id="editor-tabs" className="flex"></div>
      <div id="editor-element-id"></div>
      <div className="editor--status_bar">
        <div id="editor--session-name"></div>
      </div>
    </>
  );
};

export default Editor;
