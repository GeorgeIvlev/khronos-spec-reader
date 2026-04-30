import { Channel, invoke } from '@tauri-apps/api/core';

interface CommandEvent {
  event: 'stdout' | 'stderr' | 'error' | 'finished';
  data: string | number;
}

export interface ExecOptions {
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

export async function execCommand(
  command: string,
  options: ExecOptions = {},
): Promise<{ exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const channel = new Channel<CommandEvent>();

    channel.onmessage = (event) => {
      switch (event.event) {
        case 'stdout': {
          console.log('stdout:', event.data);
          options.onStdout?.(event.data as string);
          break;
        }
        case 'stderr': {
          console.log('stderr:', event.data);
          options.onStderr?.(event.data as string);
          break;
        }
        case 'error':
          reject(new Error(event.data as string));
          break;
        case 'finished':
          resolve({ exitCode: event.data as number });
          break;
      }
    };

    invoke('exec_command', { command, channel }).catch(reject);
  });
}

// const result = invoke('exec', { command: "C:/Programming/msys64/mingw64/bin/g++.exe --version"})
// console.log(result)
// invoke("stream_file_content", {
// 	path: "F:\\Engines\\Enemy-Territory\\src\\renderer\\tr_bsp.c",
// });
//
// invoke("list_directory_contents", {
// 	path: "F:\\Engines\\FrostBiteSourceCode\\dev\\TnT\\Code\\Engine",
// }).then((results) => {
// 	console.log("FILES LIST: ", results);
// });

// import ClangdClient from '@components/editor/Lsp'

// if (!localStorage.getItem('lsp-initialized')) {
//   ClangdClient.start()
//     .then(() => {
//       return ClangdClient.initialize(
//         'file:///C:/Users/georg/CLionProjects/test_webview',
//       )
//     })
//     .then(() => {
//       return ClangdClient.initialized()
//     })
//     .then(() => {
//       localStorage.setItem('lsp-initialized', '')
//     })
//     .catch(() => {
//       localStorage.setItem('lsp-initialized', '')
//     })
// }
