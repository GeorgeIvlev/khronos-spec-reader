import { useEffect, useCallback, useState, useRef } from 'react';
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks';
import { Modal, Input } from '@mantine/core';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import EventManager from '@services/EventManager';

interface SearchHandle {
  id: string;
}

// TODO: Think where to put this logic.
class SearchClient {
  async search(
    pattern: string,
    path: string,
    type: 'file' | 'content' = 'file',
    callbacks: {
      onBatch: (lines: string[]) => void;
      onDone: () => void;
    },
  ): Promise<() => void> {
    const handle = await invoke<SearchHandle>(
      type === 'content' ? 'search_content' : 'search_files',
      {
        pattern,
        path,
      },
    );

    const unlistenBatch = await listen<string[]>(`search:${handle.id}`, (event) => {
      callbacks.onBatch(event.payload); // Raw strings: ["path1", "path2", ...]
    });

    const unlistenDone = await listen(`search:${handle.id}:done`, () => {
      console.clear();
      callbacks.onDone();
      unlistenBatch();
      unlistenDone();
    });

    return () => {
      unlistenBatch();
      unlistenDone();
    };
  }
}

const searchClient = new SearchClient();

const SearchNavigate = (props) => {
  const [searchType, setSearchType] = useState<'file' | 'content'>('file');
  const searchInput = useRef<HTMLInputElement>(null);
  const [opened, { open, close, toggle }] = useDisclosure(false);
  const activeFileRef = useRef<HTMLElement>(null);

  const keyHandle = useCallback((e: KeyboardEvent) => {
    if (!activeFileRef.current) {
      return;
    }

    // Select and open current active file in search
    if (e.key === 'Enter') {
      console.log('ENTER: ', activeFileRef.current.textContent);
      (window as any).__CURRENT_FILE_PATH__ = activeFileRef.current.textContent;
      EventManager.emit('open-file', activeFileRef.current.textContent);
      close();
    }

    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

    if (activeFileRef.current) {
      activeFileRef.current.attributeStyleMap.delete('background-color');
    }

    if (e.key === 'ArrowDown' && activeFileRef.current.nextElementSibling) {
      activeFileRef.current = activeFileRef.current.nextElementSibling as HTMLElement;
    }

    if (e.key === 'ArrowUp' && activeFileRef.current.previousElementSibling) {
      activeFileRef.current = activeFileRef.current.previousElementSibling as HTMLElement;
    }

    activeFileRef.current.attributeStyleMap.set('background-color', '#b1d3ef');
  }, []);

  const handleSearch = (input: string) => {
    const fragment = document.createDocumentFragment();
    let unlistenRef: () => void;
    searchClient
      .search(input, localStorage.getItem('current-folder') as string, searchType, {
        onBatch: (lines) => {
          lines.forEach((path) => {
            const div = document.createElement('div');
            div.textContent = path;
            fragment.appendChild(div);
          });
        },
        onDone: () => {
          unlistenRef();

          const fileContainer = document.getElementById('available-files-list-container');
          if (fileContainer) {
            fileContainer.replaceChildren(fragment);
          }

          const firstElement = fileContainer?.firstElementChild as HTMLElement;

          if (firstElement) {
            activeFileRef.current = firstElement;
            activeFileRef.current.attributeStyleMap.set('background-color', '#b1d3ef');
          }
        },
      })
      .then((unlisten) => {
        unlistenRef = unlisten;
      });
  };

  const debounced = useDebouncedCallback(handleSearch, {
    delay: 200,
    flushOnUnmount: true,
  });

  useEffect(() => {
    EventManager.on('file-select-start', () => {
      setSearchType('file');
      open();
      setTimeout(() => {
        searchInput.current?.focus();
      }, 0);
    });

    EventManager.on('file-content-search', () => {
      setSearchType('content');
      open();
      setTimeout(() => {
        searchInput.current?.focus();
      }, 0);
    });

    EventManager.listen('keydown', keyHandle);

    return () => {};
  }, []);

  return (
    <Modal opened={opened} onClose={close} title="" centered withCloseButton={false}>
      <Input
        ref={searchInput}
        variant="unstyled"
        size="xs"
        radius="xs"
        placeholder="Search files..."
        onChange={(event) => debounced(event.target.value)}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '240px',
          flexWrap: 'nowrap',
          fontSize: '12px',
        }}
      >
        <div id="available-files-list-container" style={{ overflow: 'auto' }}></div>
      </div>
    </Modal>
  );
};

export default SearchNavigate;

/**
 * maximum depth:
 *  fd -d 2
 *
 * search by size:
 *  fd --size +100M
 *  fd -S 10K
 */

// TODO: Can make \f or \d for file or directory search
// -t f	search only files
// -t d	search only directories
// -t l	symbolic links
// -t x	executable files
// -t e	empty files
// -t s	sockets

// Command+Shift+F - search content in files with ripgrep
// Command+F - search for files

/**
 * 
 * 
 * FD
 * 
 * -C, --base-directory <path>
 * -j, --threads <num>
 * --format <fmt>
 * -0, --print0
 * -t, --type <filetype>
          Filter the search by type: 
            'f' or 'file':         regular files 
            'd' or 'dir' or 'directory':    directories 
            'l' or 'symlink':      symbolic links 
            's' or 'socket':       socket 
            'p' or 'pipe':         named pipe (FIFO) 
            'b' or 'block-device': block device 
            'c' or 'char-device':  character device 
          
            'x' or 'executable':   executables 
            'e' or 'empty':        empty files or directories
          
          This option can be specified more than once to include multiple file types. Searching
          for '--type file --type symlink' will show both regular files as well as symlinks. Note
          that the 'executable' and 'empty' filters work differently: '--type executable' implies
          '--type file' by default. And '--type empty' searches for empty files and directories,
          unless either '--type file' or '--type directory' is specified in addition.
          
          Examples: 
            - Only search for files: 
                fd --type file … 
                fd -tf … 
            - Find both files and symlinks 
                fd --type file --type symlink … 
                fd -tf -tl … 
            - Find executable files: 
                fd --type executable 
                fd -tx 
            - Find empty files: 
                fd --type empty --type file 
                fd -te -tf 
            - Find empty directories: 
                fd --type empty --type directory 
                fd -te -td

  -e, --extension <ext>
          (Additionally) filter search results by their file extension. Multiple allowable file
          extensions can be specified.
 *   -S, --size <size>
          Limit results based on the size of files using the format <+-><NUM><UNIT>.
             '+': file size must be greater than or equal to this
             '-': file size must be less than or equal to this
          
          If neither '+' nor '-' is specified, file size must be exactly equal to this.
             'NUM':  The numeric size (e.g. 500)
             'UNIT': The units for NUM. They are not case-sensitive.
          Allowed unit values:
              'b':  bytes
              'k':  kilobytes (base ten, 10^3 = 1000 bytes)
              'm':  megabytes
              'g':  gigabytes
              't':  terabytes
              'ki': kibibytes (base two, 2^10 = 1024 bytes)
              'mi': mebibytes
              'gi': gibibytes
              'ti': tebibytes
 *   -x, --exec <cmd>...
          Execute a command for each search result in parallel (use --threads=1 for sequential
          command execution). There is no guarantee of the order commands are executed in, and the
          order should not be depended upon. All positional arguments following --exec are
          considered to be arguments to the command - not to fd. It is therefore recommended to
          place the '-x'/'--exec' option last.
          The following placeholders are substituted before the command is executed:
            '{}':   path (of the current search result)
            '{/}':  basename
            '{//}': parent directory
            '{.}':  path without file extension
            '{/.}': basename without file extension
            '{{':   literal '{' (for escaping)
            '}}':   literal '}' (for escaping)
          
          If no placeholder is present, an implicit "{}" at the end is assumed.
          
          Examples:
          
            - find all *.zip files and unzip them:
          
                fd -e zip -x unzip
          
            - find *.h and *.cpp files and run "clang-format -i .." for each of them:
          
                fd -e h -e cpp -x clang-format -i
          
            - Convert all *.jpg files to *.png files:
          
                fd -e jpg -x convert {} {.}.png
 */
