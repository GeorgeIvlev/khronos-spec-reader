import { error } from '@tauri-apps/plugin-log';
import { Channel, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface CommandEvent {
  event: 'stdout' | 'stderr' | 'error' | 'finished';
  data: string | number;
}

export async function execCommand(
  command: string,
  callback: (event: CommandEvent) => void,
) {
  const channel = new Channel<CommandEvent>();

  channel.onmessage = (event) => {
    callback(event);

    // TODO: Later handle these events in a more structured way, maybe with separate callbacks for stdout, stderr, etc.

    // switch (event.event) {
    //   case 'stdout':
    //     console.log('STDOUT:', event.data);
    //     callback(event);
    //     // appendToTerminal(event.data as string, 'output');
    //     break;
    //   case 'stderr':
    //     console.error('STDERR:', event.data);
    //     // appendToTerminal(event.data as string, 'error');
    //     break;
    //   case 'error':
    //     console.error('ERROR:', event.data);
    //     // appendToTerminal(`Error: ${event.data}`, 'error');
    //     break;
    //   case 'finished':
    //     console.log('Process finished with code:', event.data);
    //     // appendToTerminal(`\n[Process exited with code ${event.data}]`, 'info');
    //     break;
    // }
  };

  try {
    return invoke('exec_command', { command, channel });
  } catch (e) {
    console.error('Failed to execute:', e);
  }
}
const greet = async () => {
  // const result = await invoke('exec', { command: "C:/Programming/msys64/mingw64/bin/g++.exe --version"})
  // console.log(result)
  // const chunks: Uint8Array[] = [];
  // let fileSize = 0;
  // // Set up listeners
  // const unlistenStart = await listen("file-stream-start", (event) => {
  // 	fileSize = (event.payload as any).fileSize;
  // 	console.log("Starting stream, size:", fileSize);
  // });
  //
  // const unlistenData = await listen("file-stream-chunk", (event) => {
  // 	const { data, offset } = event.payload as any;
  // 	const bytes = new Uint8Array(data);
  // 	chunks.push(new Uint8Array(data));
  // 	console.log(`Got ${bytes.length} bytes at offset ${offset}`);
  // });
  //
  // const unlistenEnd = await listen("file-stream-end", (event) => {
  // 	const { success, error } = event.payload as any;
  //
  // 	if (success) {
  // 		// Combine chunks
  // 		const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  // 		const fileData = new Uint8Array(totalLength);
  // 		let pos = 0;
  // 		for (const chunk of chunks) {
  // 			fileData.set(chunk, pos);
  // 			pos += chunk.length;
  // 		}
  //
  // 		const text = new TextDecoder().decode(fileData);
  // 		editor.setValue(text, -1);
  //
  // 		console.log("File complete:", fileData);
  // 	} else {
  // 		console.error("Stream failed:", error);
  // 	}
  //
  // 	// Clean up
  // 	unlistenStart();
  // 	unlistenData();
  // 	unlistenEnd();
  // });
  // invoke("stream_file_content", {
  // 	path: "F:\\Engines\\Enemy-Territory\\src\\renderer\\tr_bsp.c",
  // });
  //
  // invoke("list_directory_contents", {
  // 	path: "F:\\Engines\\FrostBiteSourceCode\\dev\\TnT\\Code\\Engine",
  // }).then((results) => {
  // 	console.log("FILES LIST: ", results);
  // });
};
