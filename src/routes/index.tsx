import { useEffect, useRef } from 'react';
import {
  Outlet,
  RouterProvider,
  Link,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router';

// import Editor from '@components/editor/Editor';
// import ToolBar from '@components/tool-bar/ToolBar';
import SettingsLayout from '@components/settings/SettingsLayout';
import SourceTreeLayout from '@components/sourcetree/SourceTreeLayout';
import ShortcutManager from '@services/ShortcutManager';
import SearchNavigate from '@components/editor/search/SearchNavigate';

import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { cpp } from '@codemirror/lang-cpp';

const Editor = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          cpp(),
          oneDark,
          EditorView.editable.of(!props.readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              props.onChange?.(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: 'new content here',
      },
    });

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="editor" />;
};

const rootRoute = createRootRoute({
  component: () => (
    <div className="root-container">
      <div className="root-outlet">
        <Outlet />
      </div>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return (
      <div className="h-100 flex flex-column">
        <Editor />
        <SearchNavigate />
      </div>
    );
  },
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: function About() {
    return <div className="p-2">Hello from About!</div>;
  },
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
const router = createRouter({ routeTree });

export default router;

// Insert at cursor/selection start
// const pos = view.state.selection.main.head;

// view.dispatch({
//   changes: { from: pos, insert: 'inserted text' },
// });

// // Move cursor after inserted text
// view.dispatch({ selection: { anchor: pos + 'inserted text'.length } });

// REPLACE SELECTION
// view.dispatch({
//   changes: {
//     from: view.state.selection.main.from,
//     to: view.state.selection.main.to,
//     insert: 'replacement',
//   },
// });

// Multiple Changes at Once
// view.dispatch({
//   changes: [
//     { from: 0, to: 5, insert: 'hello' },
//     { from: 10, to: 15, insert: 'world' },
//   ],
// });

// Append to End
// const len = view.state.doc.length;

// view.dispatch({
//   changes: { from: len, insert: '\n// appended' },
// });

// Prepend to Start
// view.dispatch({
//   changes: { from: 0, insert: '// header\n' },
// });

// // Read Current Content
// const fullText = view.state.doc.toString();

// // Or slice a range
// const slice = view.state.sliceDoc(from, to);
