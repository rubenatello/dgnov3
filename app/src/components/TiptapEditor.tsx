import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content?: string;
  onChange?: (json: object) => void;
  editable?: boolean;
}

export default function TiptapEditor({ content, onChange, editable = true }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<p>Start writing...</p>',
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-stone rounded-lg overflow-hidden bg-paper">
      {editable && (
        <div className="border-b border-stone bg-stone/30 p-2 flex gap-2 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('bold') ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('italic') ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('heading', { level: 2 }) ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('heading', { level: 3 }) ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            H3
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('bulletList') ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('orderedList') ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            1. List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded hover:bg-accent/20 transition ${
              editor.isActive('blockquote') ? 'bg-accent text-paper' : 'bg-paper'
            }`}
          >
            Quote
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-lg max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  );
}
