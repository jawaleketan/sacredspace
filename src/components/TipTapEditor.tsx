import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { createServerFn } from "@tanstack/react-start";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { validateImageUpload, generateUploadName } from "~/lib/upload";

const uploadContentImage = createServerFn({ method: "POST" })
  .validator((data: { imageBase64: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    const { buffer, ext } = validateImageUpload(data.imageBase64);
    const name = generateUploadName("img", ext);
    const uploadDir = path.resolve("public/uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), buffer);
    return { url: `/uploads/${name}` };
  });

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      resolve(result.split(",")[1]);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUrlPrompt, setShowUrlPrompt] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUrlPrompt) return;
    const el = promptRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowUrlPrompt(false); return; }
      if (e.key !== "Tab") return;
      const focusable = el.querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showUrlPrompt]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Write content..." }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  async function handleImageUpload(file: File) {
    const imageBase64 = await toBase64(file);
    const { url } = await uploadContentImage({ data: { imageBase64, fileName: file.name } });
    editor.chain().focus().setImage({ src: url }).run();
  }

  function handleImageUrl() {
    setUrlInput("");
    setShowUrlPrompt(true);
  }

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-outline-variant bg-surface-container-low px-3 py-2">
        {[
          { label: "B", ariaLabel: "Bold", action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), style: "font-bold" },
          { label: "I", ariaLabel: "Italic", action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), style: "italic" },
          { label: "S", ariaLabel: "Strikethrough", action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), style: "line-through" },
          { label: "\u00B6", ariaLabel: "Heading", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }) },
          { label: "\u201C", ariaLabel: "Blockquote", action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote") },
          { label: "\u2022", ariaLabel: "Bullet list", action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList") },
          { label: "1.", ariaLabel: "Ordered list", action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList") },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            aria-label={btn.ariaLabel}
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
          onClick={() => fileRef.current?.click()}
          className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Upload image"
          title="Upload image"
        >
          &#x1F5BC;
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={handleImageUrl}
          className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Paste image URL"
          title="Paste image URL"
        >
          &#x1F517;
        </button>
        <span className="mx-1 self-center text-outline-variant">|</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Line break"
          title="Line break"
        >
          &crarr;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Horizontal rule"
          title="Horizontal rule"
        >
          &mdash;
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_p]:my-1 [&_.ProseMirror]:font-devanagari [&_.ProseMirror]:text-lg [&_.ProseMirror]:leading-[2] [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-4"
      />
      {showUrlPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Insert image URL" onClick={() => setShowUrlPrompt(false)} onKeyDown={(e) => { if (e.key === "Escape") setShowUrlPrompt(false); }}>
          <div ref={promptRef} className="rounded-xl bg-surface-container-lowest p-6 shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm text-on-surface-variant">Paste image URL:</p>
            <input
              autoFocus
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && urlInput) {
                  editor.chain().focus().setImage({ src: urlInput }).run();
                  setShowUrlPrompt(false);
                }
              }}
              placeholder="https://..."
              className="w-full rounded-lg border border-outline-variant bg-bg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-accent-gold"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUrlPrompt(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (urlInput) {
                    editor.chain().focus().setImage({ src: urlInput }).run();
                    setShowUrlPrompt(false);
                  }
                }}
                className="rounded-lg bg-accent-gold px-3 py-1.5 text-sm text-on-accent transition-colors hover:bg-accent-gold/90 disabled:opacity-50"
                disabled={!urlInput}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
