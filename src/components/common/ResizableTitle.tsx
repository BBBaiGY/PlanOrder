import { Resizable } from 'react-resizable'
import 'react-resizable/css/styles.css'
import './ResizableTitle.css'

interface ResizableTitleProps {
  onResize?: (e: unknown, data: { size: { width: number } }) => void
  width?: number
  [key: string]: unknown
}

const ResizableTitle = (props: ResizableTitleProps) => {
  const { onResize, width, ...restProps } = props

  if (!width) {
    return <th {...restProps} />
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  )
}

export default ResizableTitle
