import { FaGear, FaPencil, FaGitAlt } from 'react-icons/fa6';
import { SiIterm2 } from 'react-icons/si';

// import { Group, ActionIcon } from '@mantine/core';

import './style.scss';

const ToolBar = () => {
  // const navigate = useNavigate()

  const onSettingsClick = (route: string) => {
    // navigate(route)
  };

  return (
    <div className="status-bar">
      <Group>
        <ActionIcon onClick={() => onSettingsClick('/settings')} variant="transparent" color="gray">
          <FaGear />
        </ActionIcon>
        <ActionIcon onClick={() => onSettingsClick('/')} variant="transparent" color="gray">
          <FaPencil />
        </ActionIcon>
        <ActionIcon
          onClick={() => onSettingsClick('/sourcetree')}
          variant="transparent"
          color="gray"
        >
          <FaGitAlt />
        </ActionIcon>
        <ActionIcon
          onClick={() => onSettingsClick('/sourcetree')}
          variant="transparent"
          color="gray"
        >
          <SiIterm2 />
        </ActionIcon>
      </Group>
      <Group>
        <button onClick={() => window.location.reload()}>reload</button>
      </Group>
    </div>
  );
};

export default ToolBar;
