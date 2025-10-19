// article-figure-view.tsx
import * as React from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react' // 👈 add this
import { getMediaById } from '../../../../src/services/mediaService'

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

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - startX.current
    const base = startW.current ?? (wrapperRef.current?.getBoundingClientRect().width ?? 0)
    const newWidth = Math.max(120, Math.round(base + dx))
    updateAttributes({ width: newWidth })
  }, [updateAttributes])

  const onMouseUp = React.useCallback(() => {
    dragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  React.useEffect(() => {
    // If src is empty but mediaId is present (saved as data-media-id), try to fetch the URL
    // so the editor shows the image when loading published content.
    const tryLoadFromMedia = async () => {
      const nodeAttrs = node.attrs as Record<string, unknown>
      const mediaId = typeof nodeAttrs.mediaId === 'string' ? (nodeAttrs.mediaId as string) : undefined
      const src = typeof nodeAttrs.src === 'string' ? (nodeAttrs.src as string) : undefined
      if (!src && mediaId) {
        const m = await getMediaById(mediaId)
        if (m && typeof (m.url) === 'string') {
          updateAttributes({ src: m.url })
        }
      }
    }
    tryLoadFromMedia()
    return () => {
      // cleanup if unmounted during drag
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [node.attrs, onMouseMove, onMouseUp, updateAttributes])

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
    const maybe = props as unknown as { getPos?: () => number }
    const pos = maybe.getPos?.()
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
