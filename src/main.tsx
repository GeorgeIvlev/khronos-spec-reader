import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import Editor from './components/editor/Editor';
import App from './App';

// import ShortcutManager from './services/ShortcutManager';
// ShortcutManager.addShortcut('Ctrl+Tab', () => {
//     console.log("Hello tab!");
// })

import './index.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Editor />
  </StrictMode>,
);
