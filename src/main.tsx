import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import '@mantine/core/styles.css';
import './index.scss';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <App />,
  // </StrictMode>,
);
