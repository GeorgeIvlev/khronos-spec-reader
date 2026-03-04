import { FaGear, FaPencil, FaGitAlt, FaTerminal } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';

import { Group, ActionIcon } from '@mantine/core';

import './style.scss';

const StatusBar = () => {
  const navigate = useNavigate();

  const onSettingsClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="status-bar">
      <Group>
        <ActionIcon
          onClick={() => onSettingsClick('/settings')}
          variant="transparent"
          color="gray"
        >
          <FaGear />
        </ActionIcon>
        <ActionIcon
          onClick={() => onSettingsClick('/')}
          variant="transparent"
          color="gray"
        >
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
          <FaTerminal />
        </ActionIcon>
      </Group>
      <Group></Group>
      <Group></Group>
    </div>
  );
};

export default StatusBar;
