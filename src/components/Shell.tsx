import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { downloadBackup, parseBackup } from "../lib/backup";
import { getYourName, saveYourName } from "../lib/yourName";
import { insurerName, stateName } from "../config/catalog";
import { progressFor, searchClients } from "../lib/clients";
import { clientHref } from "../lib/routing";
import { useStore } from "../store";
import { ConfirmDialog } from "./dialogs";

export function Shell({ children }: { children: ReactNode }) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ reps: number; clients: number; note: string; state: ReturnType<typeof parseBackup> & { ok: true } } | null>(null);
  const [importLocal, setImportLocal] = useState(false);
  const [yourName, setYourName] = useState(getYourName);
  const [adminOpen, setAdminOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!adminOpen) return;
    function onPointer(event: PointerEvent) {
      if (!adminRef.current?.contains(event.target as Node)) setAdminOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAdminOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [adminOpen]);
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
              {results.length === 0 && <li className="search-empty">No matching client.</li>}
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
          <label className="your-name">
            Your name
            <input
              value={yourName}
              maxLength={80}
              placeholder="Optional"
              aria-label="Your name, shown on edits"
              onChange={(event) => {
                setYourName(event.target.value);
                saveYourName(event.target.value);
              }}
            />
          </label>
          <span className="privacy-chip">Shared with anyone who has this link</span>
          <div className="admin-menu" ref={adminRef}>
            <button
              type="button"
              className="admin-toggle"
              aria-expanded={adminOpen}
              aria-haspopup="menu"
              onClick={() => setAdminOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.43 7.43 0 0 0-.05.94c0 .32.02.63.05.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.58-.22 1.12-.54 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
                />
              </svg>
              Admin
            </button>
            {adminOpen && (
              <div className="admin-panel" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAdminOpen(false);
                    setImportLocal(true);
                  }}
                >
                  <strong>Import local boards</strong>
                  <span>Copy boards saved in this browser onto the shared list.</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAdminOpen(false);
                    downloadBackup({ version: 1, reps: store.reps, clients: store.clients });
                  }}
                >
                  <strong>Export</strong>
                  <span>Download a JSON backup of the shared boards.</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAdminOpen(false);
                    fileRef.current?.click();
                  }}
                >
                  <strong>Import</strong>
                  <span>Replace the shared boards with a JSON backup from this computer.</span>
                </button>
              </div>
            )}
          </div>
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
        Names and links are stored in Firestore and anyone with this link can view or edit them. Progrum does not store or open the files.
      </footer>
      {store.toast && (
        <div className="toast" role="status">
          {store.toast}
        </div>
      )}
      <ConfirmDialog
        open={importLocal}
        title="Copy this browser's boards to the shared list?"
        body={`This adds ${store.localBoardCount} client board${store.localBoardCount === 1 ? "" : "s"} saved on this browser. A client already there under the same rep is left in place, and only missing links are filled in.`}
        confirmLabel="Import"
        onClose={() => setImportLocal(false)}
        onConfirm={() => {
          store.importLocalBoards();
          setImportLocal(false);
        }}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Replace the shared boards?"
        body={
          pending
            ? `This backup has ${pending.reps} rep${pending.reps === 1 ? "" : "s"} and ${pending.clients} client${pending.clients === 1 ? "" : "s"}.${pending.note} Current shared boards will be replaced with this file.`
            : ""
        }
        confirmLabel="Replace"
        danger
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          store.replaceAll(pending.state.state);
          store.notify("Backup imported to the shared boards.");
          setPending(null);
          location.hash = "#/";
        }}
      />
    </>
  );
}
