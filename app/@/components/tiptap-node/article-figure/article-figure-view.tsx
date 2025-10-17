// article-figure-view.tsx
import * as React from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react' // 👈 add this

export default function ArticleFigureView(props: NodeViewProps) {
  const { node, updateAttributes, selected, editor } = props
  const attrs = node.attrs as {
    src: string
    alt: string
    description: string
    credit: string
    size: 'small' | 'medium' | 'large'
    width: number | null
  }

  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)
  const startX = React.useRef(0)
  const startW = React.useRef<number | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target?.dataset?.resizer) return
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current =
      wrapperRef.current?.getBoundingClientRect().width ?? attrs.width ?? null
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - startX.current
    const base =
      startW.current ?? (wrapperRef.current?.getBoundingClientRect().width ?? 0)
    const newWidth = Math.max(120, Math.round(base + dx))
    updateAttributes({ width: newWidth })
  }

  const onMouseUp = () => {
    dragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  React.useEffect(() => {
    return () => {
      // cleanup if unmounted during drag
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return
    if (e.key === '[') {
      e.preventDefault()
      updateAttributes({
        width: Math.max(
          120,
          (attrs.width ?? wrapperRef.current?.offsetWidth ?? 600) - 40,
        ),
      })
    }
    if (e.key === ']') {
      e.preventDefault()
      updateAttributes({
        width: (attrs.width ?? wrapperRef.current?.offsetWidth ?? 600) + 40,
      })
    }
  }

  const selectNode = () => {
    const pos = (props as any).getPos?.()
    if (typeof pos === 'number') editor.commands.setNodeSelection(pos)
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={`article-figure size-${attrs.size}${selected ? ' is-selected' : ''}`}
      data-dragging={dragging.current ? 'true' : 'false'}
      // NodeViewWrapper handles the contentEditable glue for you
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      onClick={selectNode}
    >
      <div
        className="article-figure-imgwrap"
        ref={wrapperRef}
        style={attrs.width ? { width: `${attrs.width}px` } : undefined}
      >
        <img src={attrs.src} alt={attrs.alt || ''} draggable={false} />
        <div className="article-figure-resizer" data-resizer="true" />
      </div>

      <figcaption className="article-figcaption" contentEditable={false}>
        {attrs.description ? (
          <span className="article-description">{attrs.description}</span>
        ) : null}
        {attrs.credit ? (
          <span className="article-credit">— {attrs.credit}</span>
        ) : null}
      </figcaption>
    </NodeViewWrapper>
  )
}
