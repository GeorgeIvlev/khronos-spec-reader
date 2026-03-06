import { useState, useEffect, useRef } from 'react';
import { Portal, Input } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';

import EventManager from '../../services/EventManager';

import './file-search.scss';
import { execCommand } from '../../services/CommandManager';

const FileSearch = () => {
  const [opened, setOpened] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const searchInput = useRef<HTMLInputElement>(null);

  const handleSearch = useDebouncedCallback(async (query: string) => {
    // setLoading(true);
    // setSearchResults(await getSearchResults(query));

    const results: string[] = [];

    await execCommand(`fd ${query}`, (event) => {
      console.log('Search results for query:', query, 'Event:', event);

      switch (event.event) {
        case 'stdout': {
          results.push(event.data as string);
          break;
        }
        case 'stderr': {
          break;
        }
        case 'finished': {
          console.log('Results:', results);
          setSearchResults(results);
          break;
        }
      }
    });
    // setLoading(false);
    console.log('debounced search for:', query);
  }, 500);

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    console.log('Search query:', query);

    handleSearch(query);
    // Implement your search logic here, e.g., filter file list based on query
  };

  useEffect(() => {
    EventManager.on('file-search', () => {
      setOpened(true);
      setTimeout(() => {
        searchInput.current?.focus();
      }, 0);
    });
  }, []);

  return (
    <>
      {opened && (
        <Portal>
          <div className="file-search">
            <Input
              ref={searchInput}
              variant="unstyled"
              placeholder="Search..."
              onChange={onChangeHandler}
            />
            {searchResults.map((result, index) => (
              <div key={index} className="search-result">
                {result}
              </div>
            ))}
          </div>
        </Portal>
      )}
    </>
  );
};

export default FileSearch;
