import { useEffect } from 'react';

import { execCommand } from '../../services/CommandManager';

const SourceTreeLayout = () => {
  useEffect(() => {
    execCommand(`git log --pretty=format:'{"commit":"%H"}'`, (event) => {
      console.log('Source Tree:', event.data);
    });
  }, []);

  return (
    <div>
      <h1>Source Tree</h1>
    </div>
  );
};

export default SourceTreeLayout;
