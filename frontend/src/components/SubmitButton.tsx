export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Working…" : children}
    </button>
  );
}
