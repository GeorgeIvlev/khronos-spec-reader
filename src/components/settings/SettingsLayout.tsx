import { useEffect, useState, useMemo } from 'react';

import { Input, TextInput } from '@mantine/core';

import { execCommand } from '../../services/CommandManager';

const appsMapping = new Map();

const SettingsLayout = () => {
  const [commands, setCommands] = useState<Map<string, string>>(new Map());

  // TODO: This should be moved to
  // global settings manager...
  useEffect(() => {
    ['git', 'cmake', 'python3', 'meson', 'clang', 'clang++'].forEach(
      async (app) => {
        await execCommand(`command -v ${app}`, (event) => {
          if (event.event === 'stdout') {
            console.log(app);
            appsMapping.set(app, event.data.trim());
          }
        });
      },
    );

    setCommands(appsMapping);
  }, []);

  const getClangVersion = async () => {
    execCommand(`${commands.get('clang++')} --version`, (event) => {
      if (event.event === 'stdout') {
        console.log(event.data);
      }
    });
  };

  return (
    <div>
      <h1>Settings</h1>
      {Array.from(commands.entries()).map(([app, path]) => {
        return (
          <Input.Wrapper label={app}>
            <Input value={path} readOnly />
          </Input.Wrapper>
        );
      })}

      {commands.get('clang++') && (
        <button onClick={getClangVersion}>Get Clang Version</button>
      )}
    </div>
  );
};

export default SettingsLayout;
