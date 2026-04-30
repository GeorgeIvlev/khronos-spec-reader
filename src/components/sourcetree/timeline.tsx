type Props = { data: string[] }

const Timeline = ({ data }: Props) => {
  const dataToRender = data.map((item) => {
    return <div key={item}>{item}</div>
  })

  return <span>{dataToRender}</span>
}

export default Timeline
