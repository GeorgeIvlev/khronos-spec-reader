import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

import { Col, Button, Layout } from 'antd';

import debounce from 'lodash/debounce';

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    height: 64,
    paddingInline: 48,
    backgroundColor: '#4096ff',
};

const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    minHeight: 120,
    lineHeight: '120px',
    color: '#fff',
    backgroundColor: '#0958d9',
};

const siderStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: '120px',
    color: '#fff',
    backgroundColor: '#1677ff',
};

const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#4096ff',
};

const layoutStyle = {
    overflow: 'hidden',
    height: '100%'
};

// import { fetch } from '@tauri-apps/plugin-http';
// import { exists, writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
// import reactLogo from "./assets/react.svg";
// import { invoke } from "@tauri-apps/api/core";
import './App.css';
import CommandList from "@/components/commandList.tsx";

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
            // const result = await invoke('invokeMyAss');
            // console.log("RESULT: ", result)

            const commands = await invoke('get_all_commands');
            console.log(commands);

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

    {/*<div className="content" dangerouslySetInnerHTML={{__html: state}}></div>*/}

    return (
        <>
            {/*<Col className="gutter-row">*/}
            {/*    Header*/}
            {/*</Col>*/}
            {/*<Col className="gutter-row">*/}
            {/*    <Button type="primary">Button</Button>*/}
            {/*    <div>search_keyword</div>*/}
            {/*    <input onChange={debounce(onSearchString, 400)}/>*/}
            {/*</Col>*/}
            {/*<Col className="gutter-row">Footer</Col>*/}
            <Layout style={layoutStyle}>
                <Sider width="25%" style={siderStyle}>
                    Sider
                </Sider>
                <Layout>
                    <Header style={headerStyle}>Header</Header>
                    <Content style={contentStyle}>
                        <CommandList />
                    </Content>
                    <Footer style={footerStyle}>Footer</Footer>
                </Layout>
            </Layout>
        </>
    );
}

export default App;
