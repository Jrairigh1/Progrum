import type { Client, Rep } from "../types";
import { clientHref, repHref } from "../lib/routing";

export function Meter({ filled, total }: { filled: number; total: number }) {
  const pct = total === 0 ? 0 : Math.max(0, Math.min(100, (filled / total) * 100));
  return (
    <svg className="meter" viewBox="0 0 100 8" role="img" aria-label={`${filled} of ${total} complete`}>
      <rect className="meter-track" x="0" y="0" width="100" height="8" rx="4" />
      <rect className="meter-value" x="0" y="0" width={pct} height="8" rx="4" />
    </svg>
  );
}

export function Ring({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, value)));
  return (
    <svg className="ring" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="ring-track" cx="20" cy="20" r={r} />
      <circle
        className="ring-value"
        cx="20"
        cy="20"
        r={r}
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export function Crumbs({ rep, client }: { rep?: Rep | null; client?: Client | null }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <a href="#/">Reps</a>
      {rep && (
        <>
          <span aria-hidden="true">/</span>
          {client ? <a href={repHref(rep.id)}>{rep.name}</a> : <span aria-current="page">{rep.name}</span>}
        </>
      )}
      {client && (
        <>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{client.name}</span>
        </>
      )}
    </nav>
  );
}

export function clientLink(id: string): string {
  return clientHref(id);
}
