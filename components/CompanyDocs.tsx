"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Doc {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

const BUCKET = "company-docs";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.includes("pdf")) return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("image")) return "🖼️";
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return "📊";
  return "📎";
}

export default function CompanyDocs({ company }: { company: string }) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("company_docs")
      .select("*")
      .eq("company", company)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setDocs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadDocs(); }, [company]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const slug = company.replace(/\s+/g, "-").toLowerCase();
      const path = `${user.id}/${slug}/${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from("company_docs").insert({
        user_id: user.id,
        company,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        file_type: file.type,
      });
      if (dbErr) throw dbErr;

      await loadDocs();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60);
    if (!error && data) window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (id: string, path: string) => {
    await supabase.storage.from(BUCKET).remove([path]);
    await supabase.from("company_docs").delete().eq("id", id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="border-t border-slate-100 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Research Docs
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors font-medium disabled:opacity-50 flex items-center gap-1"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Uploading…
            </>
          ) : (
            <>+ Upload</>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv,.md,.pptx"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          No docs yet — upload a research report, teardown, or notes
        </p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2 group">
              <span className="text-sm shrink-0">{fileIcon(doc.file_type)}</span>
              <button
                onClick={() => openDoc(doc.file_path)}
                className="flex-1 text-left text-xs text-slate-700 hover:text-sky-700 truncate transition-colors"
                title={doc.file_name}
              >
                {doc.file_name}
              </button>
              <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                {formatBytes(doc.file_size)}
              </span>
              <button
                onClick={() => deleteDoc(doc.id, doc.file_path)}
                title="Delete"
                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 leading-none"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
