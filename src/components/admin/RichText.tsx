import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function RichText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none min-h-[160px] p-3 focus:outline-none [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" },
    },
  });
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === "" ? "" : null, editor]);
  if (!editor) return null;
  const b = (label: string, fn: () => void, active: boolean) => (
    <Button type="button" size="sm" variant={active ? "default" : "ghost"} onClick={fn}>{label}</Button>
  );
  return (
    <div className="rounded-md border border-input">
      <div className="flex flex-wrap gap-1 border-b border-input p-1">
        {b("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {b("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {b("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {b("• Lista", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {b("1. Lista", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {b("Link", () => {
          const url = window.prompt("URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }, editor.isActive("link"))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
