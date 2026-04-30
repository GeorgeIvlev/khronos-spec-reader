// import { useEffect, useState } from 'react'

import Timeline from './timeline';

import './index.scss';

const getAllTags = () => {
  const tags: string[] = [];

  // execCommand(`git --no-pager tag`, (event) => {
  //   if (event.event === 'finished') {
  //     console.log('Finished fetching tags');
  //     return;
  //   }

  //   if (event.event === 'stdout') {
  //     const tag = event.data;
  //     console.log('TAG: ', tag);
  //     if (tag) {
  //       tags.push(tag);
  //     }
  //   }
  // });

  return tags;
};

const SourceTreeLayout = () => {
  const [commits, setCommits] = useState([]);
  useEffect(() => {
    const commitsList: string[] = [];

    (() => {
      const tags = getAllTags();
      console.log(tags);

      // execCommand(
      //   `git log --pretty=format:'{"commit":"%H"}'`,
      //   (event) => {
      //     if (event.event === 'finished') {
      //       setCommits(commitsList);
      //       return;
      //     }

      //     commitsList.push(event.data);
      //   },
      // );
    })();
  }, []);

  return (
    <div className="source-tree-layout">
      <div>
        <div>
          <label>Tags:</label>
          <div></div>
        </div>
      </div>
      <div>
        <Timeline data={commits} />
      </div>
    </div>
  );
};

export default SourceTreeLayout;
