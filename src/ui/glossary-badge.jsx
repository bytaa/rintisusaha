function GlossaryBadge({ termKey }) {
  const [open, setOpen] = React.useState(false);
  const item = GLOSSARY[termKey];
  if (!item) return null;

  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 transition" title="Klik untuk penjelasan bahasa sehari-hari">
        <span>Apa itu {termKey}?</span><span className="text-[10px] font-bold">?</span>
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl bg-slate-900 text-white text-xs leading-relaxed shadow-lg max-w-xs z-30">
          <div className="font-bold text-brand-200 mb-1 flex justify-between items-center">
            <span>{item.term}</span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white ml-2">✕</button>
          </div>
          <p>{item.plain}</p>
        </div>
      )}
    </span>
  );
}
