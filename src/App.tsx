import {useCallback, useEffect, useState} from 'react';
import { invoke } from '@tauri-apps/api/core';

import debounce from 'lodash/debounce';
// import { fetch } from '@tauri-apps/plugin-http';
// import { exists, writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import './output.css';
import './App.css';

// import { Command } from '@tauri-apps/plugin-shell';
// when using `"withGlobalTauri": true`, you may use
// const { Command } = window.__TAURI_PLUGIN_SHELL__;

const DOC_ENPOINTS = {
    // OpenGL spec
    'gl': 'OpenGL-Registry/main/xml/gl.xml',
    // Vulkan spec
    'vk': 'Vulkan-Docs/main/xml/vk.xml'
}

function App() {
    const [state, setState] = useState('');
    // const fetchHtmlDocuments = async () => {
    //     return fetch(`https://raw.githubusercontent.com/KhronosGroup/${DOC_ENPOINTS['gl']}`,
    //         { method: 'GET' }
    //     ).then((res) => res.text());
    // }
    //
    useEffect(() => {
        (async () => {
            const result = await invoke('search_keyword', { keyword: 'glGenBuffers' });
            console.log("RESULT: ", result)
    //         const cacheExists = await exists('cache.xml', { baseDir: BaseDirectory.Home });
    //
    //         if (!cacheExists) {
    //             const htmlData = await fetchHtmlDocuments();
    //             await writeTextFile('cache.xml', htmlData, { baseDir: BaseDirectory.Home });
    //             setState(htmlData)
    //         } else {
    //             const htmlData = await readTextFile('cache.xml', { baseDir: BaseDirectory.Home });
    //             setState(htmlData)
    //         }
    //
    //         // let result = await Command.create('exec-sh', [
    //         //     '-c',
    //         //     "echo 'Hello World!'",
    //         // ]).execute();
    //         // console.log(result);
        })();
    }, [])

    const onSearchString = useCallback(async (event) => {
        const result = await invoke('search_keyword', { keyword: event.target.value });
        console.log("ON SEARCH!", result, event.target.value)
    }, []);

    return (
        <div className="flex items-center space-x-2 text-base">
            <div className="header">
                <input onChange={debounce(onSearchString, 400)} />
            </div>
            <div className="content" dangerouslySetInnerHTML={{__html: state}}></div>
            <div className="sidebar">Sidebar</div>
            <div className="footer">Footer</div>
        </div>
    );
}

export default App;
