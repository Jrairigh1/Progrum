import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { downloadBackup, parseBackup } from "../lib/backup";
import { insurerName, stateName } from "../config/catalog";
import { progressFor, searchClients } from "../lib/clients";
import { clientHref } from "../lib/routing";
import { useStore } from "../store";
import { ConfirmDialog } from "./dialogs";

export function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ reps: number; clients: number; note: string; state: ReturnType<typeof parseBackup> & { ok: true } } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const stopNavigation = (event: DragEvent) => {
      event.preventDefault();
    };
    window.addEventListener("dragover", stopNavigation);
    window.addEventListener("drop", stopNavigation);
    return () => {
      window.removeEventListener("dragover", stopNavigation);
      window.removeEventListener("drop", stopNavigation);
    };
  }, []);

  const results = useMemo(
    () => searchClients(query, store.clients, store.reps),
    [query, store.clients, store.reps],
  );

  function go(id: string) {
    location.hash = clientHref(id);
    setQuery("");
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const first = results[0];
    if (first) go(first.id);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) {
      store.notify("That backup is too large to import.");
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      store.notify("That file is not a Progrum backup.");
      return;
    }
    const parsed = parseBackup(raw);
    if (!parsed.ok) {
      store.notify(parsed.error);
      return;
    }
    const note = parsed.skippedLinks
      ? ` ${parsed.skippedLinks} link${parsed.skippedLinks === 1 ? "" : "s"} that were not https will be left out.`
      : "";
    setPending({ reps: parsed.state.reps.length, clients: parsed.state.clients.length, note, state: parsed });
  }

  return (
    <>
      <header className="top">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">
            CBC
          </span>
          <span className="brand-text">
            <strong>Progrum</strong>
            <small>CBC Settlement Funding</small>
          </span>
        </a>
        <form className="search" role="search" onSubmit={onSearch}>
          <label className="sr" htmlFor="client-search">
            Find a client
          </label>
          <input
            id="client-search"
            type="search"
            placeholder="Find a client across reps"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          {query.trim() && (
            <ul className="search-results">
              {results.length === 0 && <li className="search-empty">No matching client on this browser.</li>}
              {results.map((client) => {
                const rep = store.reps.find((item) => item.id === client.repId);
                const progress = progressFor(client);
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        go(client.id);
                      }}
                    >
                      <strong>{client.name}</strong>
                      <span>
                        {rep?.name ?? "Unknown rep"}
                        {client.state ? ` · ${stateName(client.state)}` : ""}
                        {client.insurer ? ` · ${insurerName(client.insurer)}` : ""}
                        {` · ${progress.filled} of ${progress.total}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </form>
        <div className="top-actions">
          <span className="privacy-chip">Stored in this browser</span>
          <button type="button" className="btn ghost light" onClick={() => downloadBackup({ version: 1, reps: store.reps, clients: store.clients })}>
            Export
          </button>
          <button type="button" className="btn ghost light" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            className="sr"
            type="file"
            accept="application/json,.json"
            aria-label="Import a Progrum backup"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onFile(file);
            }}
          />
        </div>
      </header>
      <main>{children}</main>
      <footer className="foot">
        Names and document links stay in this browser. Progrum does not upload files or open the links itself.
      </footer>
      {store.toast && (
        <div className="toast" role="status">
          {store.toast}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Replace data on this browser?"
        body={
          pending
            ? `This backup has ${pending.reps} rep${pending.reps === 1 ? "" : "s"} and ${pending.clients} client${pending.clients === 1 ? "" : "s"}.${pending.note} Current boards on this browser will be overwritten. The file is not uploaded.`
            : ""
        }
        confirmLabel="Replace"
        danger
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          store.replaceAll(pending.state.state);
          store.notify("Backup imported on this browser.");
          setPending(null);
          location.hash = "#/";
        }}
      />
    </>
  );
}
