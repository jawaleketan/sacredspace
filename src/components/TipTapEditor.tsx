import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Write content..." }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-outline-variant bg-surface-container-low px-3 py-2">
        {[
          { label: "B", action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), style: "font-bold" },
          { label: "I", action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), style: "italic" },
          { label: "S", action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), style: "line-through" },
          { label: "\u00B6", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }) },
          { label: "\u201C", action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote") },
          { label: "\u2022", action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList") },
          { label: "1.", action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList") },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              btn.isActive
                ? "bg-accent-gold/20 text-accent-gold"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            } ${btn.style}`}
          >
            {btn.label}
          </button>
        ))}
        <span className="mx-1 self-center text-outline-variant">|</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          title="Line break"
        >
          &crarr;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          title="Horizontal rule"
        >
          &mdash;
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_p]:my-1 [&_.ProseMirror]:font-devanagari [&_.ProseMirror]:text-lg [&_.ProseMirror]:leading-[2]"
      />
    </div>
  );
}
