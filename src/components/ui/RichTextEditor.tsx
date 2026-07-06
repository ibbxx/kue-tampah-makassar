import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, RotateCcw, RotateCw } from "lucide-react";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] rounded-b-lg border-x border-b border-border bg-background p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const toggleBtnClass = (isActive: boolean) =>
    `p-2 rounded hover:bg-muted transition-colors ${
      isActive ? "bg-muted text-primary font-semibold" : "text-muted-foreground"
    }`;

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={toggleBtnClass(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={toggleBtnClass(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        
        <div className="mx-1 h-6 w-px bg-border" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toggleBtnClass(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={toggleBtnClass(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toggleBtnClass(editor.isActive("bulletList"))}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toggleBtnClass(editor.isActive("orderedList"))}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={toggleBtnClass(editor.isActive("blockquote"))}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
          title="Undo"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
          title="Redo"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
