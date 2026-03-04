import { useEffect } from 'react';

import { MantineProvider } from '@mantine/core';

import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Outlet,
} from 'react-router-dom';

import Editor from './components/editor/Editor';
import StatusBar from './components/status-bar/StatusBar';

import ShortcutManager from './services/ShortcutManager';
import SettingsLayout from './components/settings/SettingsLayout';
import SourceTreeLayout from './components/sourcetree/SourceTreeLayout';
// ShortcutManager.addShortcut('Ctrl+Tab', () => {
//     console.log("Hello tab!");
// })'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <MantineProvider>
        <div className="root-container">
          <div className="root-outlet">
            <Outlet />
          </div>
          <StatusBar />
        </div>
      </MantineProvider>
    ),
    children: [
      {
        index: true, // This makes Home the default child of the root path
        element: <Editor />,
      },
      {
        path: 'sourcetree',
        element: <SourceTreeLayout />,
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
      },
    ],
  },
]);

function App() {
  useEffect(() => {
    return () => {
      ShortcutManager.cleanup();
    };
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
