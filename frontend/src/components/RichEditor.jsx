import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { motion, AnimatePresence } from "framer-motion";

const lowlight = createLowlight(common);

export default function RichEditor({
  content = "",
  onChange,
  placeholder = "Write your thoughts, learnings, and code snippets...",
  draftKey = "new_note",
  onClearDraft,
}) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [savedDraftStatus, setSavedDraftStatus] = useState("");
  const draftTimerRef = useRef(null);

  // Initialize editor with extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Replaced by CodeBlockLowlight
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[160px] p-4 text-cream leading-relaxed text-sm",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      // Word & char count
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      if (onChange) {
        onChange(html);
      }

      // Auto save draft to localStorage
      if (draftKey) {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
          try {
            localStorage.setItem(`growth_draft_${draftKey}`, html);
            setSavedDraftStatus("Draft saved");
            setTimeout(() => setSavedDraftStatus(""), 2000);
          } catch (e) {
            console.error("Draft save error:", e);
          }
        }, 600);
      }
    },
  });

  // Load initial content or draft
  useEffect(() => {
    if (!editor) return;

    if (content !== undefined && content !== editor.getHTML()) {
      // If content is empty and a draft exists for a new note, offer to restore
      if (!content && draftKey) {
        const savedDraft = localStorage.getItem(`growth_draft_${draftKey}`);
        if (savedDraft && savedDraft.trim()) {
          editor.commands.setContent(savedDraft);
          if (onChange) onChange(savedDraft);
          setSavedDraftStatus("Draft restored");
          setTimeout(() => setSavedDraftStatus(""), 3000);
          return;
        }
      }
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  // Handle escape key to exit focus write mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode]);

  if (!editor) {
    return (
      <div className="w-full h-40 bg-ink rounded-xl animate-pulse flex items-center justify-center text-muted text-xs">
        Loading editor...
      </div>
    );
  }

  const renderToolbar = (isFull = false) => (
    <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-ink-light/80 border-b border-white/10 rounded-t-xl text-xs">
      <div className="flex flex-wrap items-center gap-1">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
            editor.isActive("bold")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2.5 py-1 rounded-lg italic font-serif transition-all ${
            editor.isActive("italic")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>

        {/* Strike */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2.5 py-1 rounded-lg line-through transition-all ${
            editor.isActive("strike")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Strikethrough"
        >
          S
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            editor.isActive("heading", { level: 1 })
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`px-2 py-1 rounded-lg font-semibold transition-all ${
            editor.isActive("heading", { level: 2 })
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded-lg transition-all ${
            editor.isActive("bulletList")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Bullet List"
        >
          • List
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded-lg transition-all ${
            editor.isActive("orderedList")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Numbered List"
        >
          1. List
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded-lg transition-all ${
            editor.isActive("blockquote")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Quote"
        >
          “ Quote
        </button>

        {/* Code Block */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2.5 py-1 rounded-lg font-mono transition-all ${
            editor.isActive("codeBlock")
              ? "bg-accent text-white"
              : "text-muted hover:text-cream hover:bg-white/5"
          }`}
          title="Code Block"
        >
          &lt;/&gt; Code
        </button>
      </div>

      {/* Focus Write Toggle */}
      <button
        type="button"
        onClick={() => setIsFocusMode(!isFocusMode)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-accent-light hover:bg-accent/10 transition-colors"
        title="Distraction-Free Focus Write Mode"
      >
        <span>{isFocusMode ? "↙ Normal" : "↗ Focus Write"}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Standard Embedded Editor */}
      <div className="w-full bg-ink border border-white/10 rounded-xl overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all flex flex-col">
        {renderToolbar(false)}

        <div className="min-h-[180px] max-h-[380px] overflow-y-auto cursor-text">
          <EditorContent editor={editor} />
        </div>

        {/* Editor Footer / Stats */}
        <div className="flex items-center justify-between px-3 py-2 bg-ink-light/50 border-t border-white/5 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>

          <div className="flex items-center gap-2">
            {savedDraftStatus && (
              <span className="text-emerald-400 font-medium">
                ✓ {savedDraftStatus}
              </span>
            )}
            <span className="text-muted/60">Markdown / Rich text</span>
          </div>
        </div>
      </div>

      {/* Focus Write Mode Fullscreen Modal */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-ink/98 backdrop-blur-2xl flex flex-col p-6 sm:p-12 overflow-hidden"
          >
            {/* Focus Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 max-w-4xl mx-auto w-full">
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="font-display text-lg text-cream">
                    Focus Write Mode
                  </h3>
                  <p className="text-xs text-muted">
                    Distraction-free environment • Press Esc to return
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {wordCount} words • {charCount} chars
                </span>
                <button
                  type="button"
                  onClick={() => setIsFocusMode(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-cream rounded-xl text-xs font-medium transition-colors"
                >
                  Exit Focus Mode (Esc)
                </button>
              </div>
            </div>

            {/* Focus Editor Container */}
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col pt-6 overflow-hidden">
              {renderToolbar(true)}
              <div className="flex-1 overflow-y-auto mt-4 pr-2">
                <EditorContent
                  editor={editor}
                  className="focus:outline-none min-h-[500px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
