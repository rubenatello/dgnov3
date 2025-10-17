import * as React from 'react'
import type { Media } from '../types/models'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'

// --- Tiptap Core Extensions ---
import { StarterKit } from '@tiptap/starter-kit'
// NOTE: we keep ImageUploadNode for uploads, but we don't need the base Image node anymore
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Highlight } from '@tiptap/extension-highlight'
// removed Subscript/Superscript — not needed for toolbar
import { Placeholder } from '@tiptap/extension-placeholder'
// Selection lives in @tiptap/extension-selection if you want the latest;
// leaving as your original import path if that’s how your project is set.
import { Selection } from '@tiptap/extensions'

// --- Custom node ---
import { ArticleFigure } from '@/components/tiptap-node/article-figure/article-figure-extension'
import '@/components/tiptap-node/article-figure/article-figure.scss'

// --- UI Primitives ---
import { Button } from '@/components/tiptap-ui-primitive/button'
import { Spacer } from '@/components/tiptap-ui-primitive/spacer'
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'

// --- Tiptap Nodes (yours) ---
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension'
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension'
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'

// --- Tiptap UI ---
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import MediaPicker from './MediaPicker'
import { ImagePlusIcon } from '@/components/tiptap-icons/image-plus-icon'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from '@/components/tiptap-ui/color-highlight-popover'
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from '@/components/tiptap-ui/link-popover'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'

// --- Icons ---
import { ArrowLeftIcon } from '@/components/tiptap-icons/arrow-left-icon'
import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon'
import { LinkIcon } from '@/components/tiptap-icons/link-icon'

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile'
import { useWindowSize } from '@/hooks/use-window-size'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils'

// --- Styles ---
import '@/components/tiptap-templates/simple/simple-editor.scss'
import './ArticleEditor.scss'

interface ArticleEditorProps {
  content: string
  onChange: (content: string) => void
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  onAddClick,
  onSizeSmall,
  onSizeMedium,
  onSizeLarge,
  onWidthAuto,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  onAddClick: () => void
  onSizeSmall: () => void
  onSizeMedium: () => void
  onSizeLarge: () => void
  onWidthAuto: () => void
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
  <ListDropdownMenu types={['bulletList', 'orderedList', 'taskList']} portal={isMobile} />
  <BlockquoteButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
  {/* inline code removed */}
        <MarkButton type="underline" />
        {!isMobile ? <ColorHighlightPopover /> : <ColorHighlightPopoverButton onClick={onHighlighterClick} />}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Figure controls */}
      <ToolbarGroup>
        <Button data-style="ghost" title="Figure: Small" onClick={onSizeSmall}>
          S
        </Button>
        <Button data-style="ghost" title="Figure: Medium" onClick={onSizeMedium}>
          M
        </Button>
        <Button data-style="ghost" title="Figure: Large" onClick={onSizeLarge}>
          L
        </Button>
        <Button data-style="ghost" title="Figure: Auto Width" onClick={onWidthAuto}>
          Auto
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* Open the Media Picker to insert/select images */}
        <Button
          data-style="ghost"
          data-appearance="emphasized"
          aria-label="Insert media"
          onClick={onAddClick}
          className="tiptap-add-media"
          data-size="small"
        >
          <ImagePlusIcon className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: 'highlighter' | 'link'
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === 'highlighter' ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === 'highlighter' ? <ColorHighlightPopoverContent /> : <LinkContent />}
  </>
)

export function ArticleEditor({ content, onChange }: ArticleEditorProps) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<'main' | 'highlighter' | 'link'>('main')
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': 'Article content editor',
        class: 'simple-editor article-editor-content', // ensure scoping styles apply
        'data-placeholder': 'Start writing your article here...',
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: { openOnClick: false, enableClickSelection: true },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: true }),
  Typography,
  Selection,
      Placeholder.configure({ placeholder: 'Start writing your article here...' }),

      // Uploads (your existing uploader). It should ultimately insert our custom node,
      // but it’s fine if it just provides the file URL—we insert via handleInsertMedia below.
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error('Upload failed:', error),
      }),

      // 👇 Our custom figure node with non-editable caption
      ArticleFigure,
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
  })

  // Media picker state
  const [pickerOpen, setPickerOpen] = React.useState(false)

  // Insert ArticleFigure using the command (no raw HTML)
  const handleInsertMedia = (media: Media, size: 'small' | 'medium' | 'large' = 'medium') => {
    if (!editor || !media) return
    editor
      .chain()
      .focus()
      .insertArticleFigure({
        src: media.url,
        alt: media.alt || media.title || '',
        description: media.description || '',
        credit: media.sourceCredit || '',
        mediaId: media.id,
        size,
        width: null, // user can drag to set width later
      })
      .run()
  }

  // toolbar helpers target the selected ArticleFigure
  const setSize = (s: 'small' | 'medium' | 'large') => editor?.commands.setArticleFigureSize(s)
  const setWidthAuto = () => editor?.commands.setArticleFigureWidth(null)

  // Only set content when it's externally changed (e.g., opening an existing article)
  const isFirstRender = React.useRef(true)
  React.useEffect(() => {
    if (editor && content && isFirstRender.current) {
      editor.commands.setContent(content)
      isFirstRender.current = false
    }
  }, [editor, content])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== 'main') setMobileView('main')
  }, [isMobile, mobileView])

  return (
    <div className="article-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          className="tiptap-toolbar"
          style={{
            ...(isMobile ? { bottom: `calc(100% - ${height - rect.y}px)` } : {}),
          }}
        >
          {mobileView === 'main' ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView('highlighter')}
              onLinkClick={() => setMobileView('link')}
              isMobile={isMobile}
              onAddClick={() => setPickerOpen(true)}
              onSizeSmall={() => setSize('small')}
              onSizeMedium={() => setSize('medium')}
              onSizeLarge={() => setSize('large')}
              onWidthAuto={setWidthAuto}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === 'highlighter' ? 'highlighter' : 'link'}
              onBack={() => setMobileView('main')}
            />
          )}
        </Toolbar>

        {/* Media Picker modal used to select/upload images to insert */}
        <MediaPicker
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(m: Media, size: 'small' | 'medium' | 'large' = 'medium') => handleInsertMedia(m, size)}
        />

        <EditorContent editor={editor} role="presentation" className="article-editor-content" />
      </EditorContext.Provider>
    </div>
  )
}
