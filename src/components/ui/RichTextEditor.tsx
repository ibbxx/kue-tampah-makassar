import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, RotateCcw, RotateCw } from "lucide-react";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((t) => t + 1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] rounded-b-lg border-x border-b border-border bg-background p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => {
      forceUpdate();
    },
  });

  if (!mounted || !editor) {
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
          disabled={editor.state.selection.empty || !editor.can().chain().focus().toggleBold().run()}
          className={`${toggleBtnClass(editor.isActive("bold"))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Bold (Membutuhkan seleksi teks)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={editor.state.selection.empty || !editor.can().chain().focus().toggleItalic().run()}
          className={`${toggleBtnClass(editor.isActive("italic"))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Italic (Membutuhkan seleksi teks)"
        >
          <Italic className="h-4 w-4" />
        </button>
        
        <div className="mx-1 h-6 w-px bg-border" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={editor.state.selection.empty}
          className={`${toggleBtnClass(editor.isActive("heading", { level: 2 }))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Heading 2 (Membutuhkan seleksi teks)"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={editor.state.selection.empty}
          className={`${toggleBtnClass(editor.isActive("heading", { level: 3 }))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Heading 3 (Membutuhkan seleksi teks)"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={editor.state.selection.empty}
          className={`${toggleBtnClass(editor.isActive("bulletList"))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Bullet List (Membutuhkan seleksi teks)"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={editor.state.selection.empty}
          className={`${toggleBtnClass(editor.isActive("orderedList"))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Ordered List (Membutuhkan seleksi teks)"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={editor.state.selection.empty}
          className={`${toggleBtnClass(editor.isActive("blockquote"))} disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Blockquote (Membutuhkan seleksi teks)"
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
