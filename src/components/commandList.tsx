import { useEffect, useState } from 'react';
import { List } from 'antd';
import VirtualList from 'rc-virtual-list';

import Command from './command';

const CommandList = () => {
    const [list, setList] = useState<[]>([]);


    useEffect(() => {
        // setList();
    }, []);


    return (
        <List>
            <VirtualList
                data={list}
                height={400}
                itemHeight={50}
                itemKey="email"
                onScroll={() => {}}
            >
                {(command: any) => (
                    <List.Item key={command.name}>
                        <Command />
                    </List.Item>
                )}
            </VirtualList>
        </List>
    )
};

export default CommandList;
