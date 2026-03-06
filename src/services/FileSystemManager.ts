import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import EventManager from './EventManager';

export class FileSystemManager {
  private openedFiles: Set<string>;
  private static instance: FileSystemManager;

  static {
    console.log('FileSystemManager static initializer');

    FileSystemManager.instance = new FileSystemManager();
  }

  setupEvents() {
    EventManager.on('open-file', this.openFile);

    // const chunks: Uint8Array[] = [];
    // let fileSize = 0;
    // // Set up listeners
    // const unlistenStart = listen('file-stream-start', (event) => {
    //   fileSize = (event.payload as any).fileSize;
    //   console.log('Starting stream, size:', fileSize);
    // });
    //
    // const unlistenData = listen('file-stream-chunk', (event) => {
    //   const { data, offset } = event.payload as any;
    //   const bytes = new Uint8Array(data);
    //   chunks.push(new Uint8Array(data));
    //   console.log(`Got ${bytes.length} bytes at offset ${offset}`);
    // });
    //
    // const unlistenEnd = listen('file-stream-end', (event) => {
    //   const { success, error } = event.payload as any;
    //
    //   if (success) {
    //     // Combine chunks
    //     const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    //     const fileData = new Uint8Array(totalLength);
    //     let pos = 0;
    //     for (const chunk of chunks) {
    //       fileData.set(chunk, pos);
    //       pos += chunk.length;
    //     }
    //
    //     // const text = new TextDecoder().decode(fileData);
    //     // editor.setValue(text, -1);
    //
    //     console.log('File complete:', fileData);
    //   } else {
    //     console.error('Stream failed:', error);
    //   }
    //
    //   //   // Clean up
    //   //   unlistenStart();
    //   //   unlistenData();
    //   //   unlistenEnd();
    // });
  }

  openFile = async (path: string) => {
    if (!path) return;

    console.log('Requesting to open file:', path);

    invoke('stream_file_content', { path });
  };
  // fd as search provider
}
