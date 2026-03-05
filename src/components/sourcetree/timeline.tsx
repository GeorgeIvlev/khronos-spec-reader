const Timeline: React.FC = ({ data }: { data: any[] }) => {
  const dataToRender = data.map((item, index) => {
    return <div key={index}>{item}</div>;
  });

  return <span>{dataToRender}</span>;
};

export default Timeline;
