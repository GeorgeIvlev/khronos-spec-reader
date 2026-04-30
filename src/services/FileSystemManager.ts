import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import EventManager from '@services/EventManager';
import GlobalStateManager from '@services/GlobalStateManager';

export class FileSystemManager {
  // private openedFiles: Set<string>;
  private static instance: FileSystemManager;

  static {
    console.log('FileSystemManager static initializer');
    FileSystemManager.instance = new FileSystemManager();
    FileSystemManager.instance.setupEvents();
  }

  setupEvents() {
    EventManager.on('open-file', this.openFile);
    EventManager.on('open-folder', this.openFolder);
    EventManager.on('write-file', this.onWriteFile);

    const chunks: Uint8Array[] = [];
    let fileSize = 0;

    // @ts-ignore
    window.eventListeners = [];
    // Set up listeners
    // @ts-ignore
    window.eventListeners.push(
      listen('file-stream-start', (event) => {
        fileSize = (event.payload as any).fileSize;
        // console.log('Starting stream, size:', fileSize);
        chunks.length = 0; // Clear previous chunks;
      }),
    );

    // @ts-ignore
    window.eventListeners.push(
      listen('file-stream-chunk', (event) => {
        const { data, offset } = event.payload as any;
        const bytes = new Uint8Array(data);
        chunks.push(new Uint8Array(data));
        // console.log(`Got ${bytes.length} bytes at offset ${offset}`);
      }),
    );

    // @ts-ignore
    window.eventListeners.push(
      listen('file-stream-end', (event) => {
        const { success, error } = event.payload as any;

        if (success) {
          // Combine chunks
          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const fileData = new Uint8Array(totalLength);
          let pos = 0;
          for (const chunk of chunks) {
            fileData.set(chunk, pos);
            pos += chunk.length;
          }

          // @ts-ignore
          window.__FILE_CONTENT__ = fileData;

          EventManager.emit('open-file-success');
          // console.log('File complete:', totalLength);
        } else {
          console.error('Stream failed:', error);
        }
      }),
    );
  }

  openFile = (path: string) => {
    if (!path) return;
    // console.log('Requesting to open file:', path);
    // @ts-ignore
    window.__FILE_PATH__ = path;
    return invoke('stream_file_content', { path });
  };

  openFolder = (path: string) => {
    if (!path) return;
    // console.log('Requesting to open folder:', path);

    // TODO:
    const files: [] = [];
    // const files = invoke('list_directory_contents', { path })
    // .then();
    // if (!files) return;

    GlobalStateManager.setValue('available-files', files);
  };

  onWriteFile = ({ content, path }: { content: any; path: string }) => {
    return invoke('write_file', { path, content });
  };

  // fd as search provider
}
