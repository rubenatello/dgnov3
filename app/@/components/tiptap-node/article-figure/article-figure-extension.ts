import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ArticleFigureView from './article-figure-view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleFigure: {
      insertArticleFigure: (opts: {
        src: string
        alt?: string
        description?: string
        credit?: string
        mediaId?: string
        size?: 'small' | 'medium' | 'large'
        width?: number | null  // px
      }) => ReturnType
      setArticleFigureSize: (size: 'small' | 'medium' | 'large') => ReturnType
      setArticleFigureWidth: (width: number | null) => ReturnType
    }
  }
}

export const ArticleFigure = Node.create({
  name: 'articleFigure',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      description: { default: '' },
      credit: { default: '' },
      mediaId: { default: '' },
      size: { default: 'medium' },           // small | medium | large (CSS max-width caps)
      width: { default: null },              // explicit px width from drag-resize; null = auto
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure.article-figure',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, description, credit, size, width, mediaId } = HTMLAttributes

    const style = width ? `style=width:${Number(width)}px;` : ''
    const sizeClass = size ? `size-${size}` : ''

    // Note: figcaption is contenteditable="false". Keep spans for styling.
    return [
      'figure',
      mergeAttributes(
        { class: `article-figure ${sizeClass}` },
        mediaId ? { 'data-media-id': mediaId } : {},
      ),
      [
        'div',
        { class: 'article-figure-imgwrap', ...(style ? { style: `width:${Number(width)}px;` } : {}) },
        ['img', { src, alt }],
        ['div', { class: 'article-figure-resizer', 'data-resizer': 'true' }], // handle overlay
      ],
      [
        'figcaption',
        { class: 'article-figcaption', contenteditable: 'false' },
        ['span', { class: 'article-description' }, description || ''],
        credit
          ? ['span', { class: 'article-credit' }, `— ${credit}`]
          : '',
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ArticleFigureView)
  },

  addCommands() {
    return {
      insertArticleFigure:
        ({ src, alt = '', description = '', credit = '', mediaId = '', size = 'medium', width = null }) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { src, alt, description, credit, mediaId, size, width },
            })
            .run()
        },

      setArticleFigureSize:
        (size) =>
        ({ state, chain }) => {
          const { selection } = state
          const node = selection.node
          if (node?.type.name === this.name) {
            return chain().updateAttributes(this.name, { size }).run()
          }
          return false
        },

      setArticleFigureWidth:
        (width) =>
        ({ state, chain }) => {
          const { selection } = state
          const node = selection.node
          if (node?.type.name === this.name) {
            return chain().updateAttributes(this.name, { width }).run()
          }
          return false
        },
    }
  },
})
