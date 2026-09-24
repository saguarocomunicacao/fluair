import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/storage";

export function RichText({ value, onChange, bucket = "banners" }: { value: string; onChange: (v: string) => void; bucket?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none min-h-[180px] p-3 focus:outline-none [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_img]:my-2 [&_img]:max-h-72 [&_img]:rounded-md" },
    },
  });
  if (!editor) return null;
  const b = (label: string, fn: () => void, active: boolean) => (
    <Button type="button" size="sm" variant={active ? "default" : "ghost"} className="h-8 px-2.5" onClick={fn}>{label}</Button>
  );
  return (
    <div className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap gap-1 border-b border-input p-1">
        {b("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
        {b("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
        {b("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
        {b("H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
        {b("• Lista", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
        {b("1. Lista", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
        {b("Link", () => {
          const url = window.prompt("URL do link (deixe vazio para remover)");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }, editor.isActive("link"))}
        {b("Imagem", () => fileRef.current?.click(), false)}
      </div>
      <EditorContent editor={editor} />
      <input ref={fileRef} type="file" hidden accept="image/*" onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        try {
          const url = await uploadFile(bucket, f);
          editor.chain().focus().setImage({ src: url }).run();
        } catch (err) { toast.error((err as Error).message); }
      }} />
    </div>
  );
}
