import { useEffect, useState } from "react";
import { insurerOptions, ipaRequired, stateName, stateOptions } from "../config/catalog";
import { corePieceCount, IPA_PIECE_IDS, LIFE_PIECE_IDS } from "../config/pieces";
import { progressFor } from "../lib/clients";
import { linkStamp } from "../lib/links";
import { repHref } from "../lib/routing";
import { useStore } from "../store";
import { AdvanceDialog } from "./AdvanceDoc";
import { CopyLinks, StateForms } from "./CopyLinks";
import { ConfirmDialog, LinkDialog, MoveDialog, NameDialog } from "./dialogs";
import { Guidance } from "./Guidance";
import { ExtraStrip, PuzzleBoard, safeHref } from "./Puzzle";
import { Crumbs, Meter } from "./ui";
import type { DealType, PieceDef } from "../types";

export function BoardPage({ clientId }: { clientId: string }) {
  const store = useStore();
  const client = store.clients.find((item) => item.id === clientId) ?? null;
  const rep = client ? store.reps.find((item) => item.id === client.repId) ?? null : null;
  const [editing, setEditing] = useState<PieceDef | null>(null);
  const [clearing, setClearing] = useState<PieceDef | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [advance, setAdvance] = useState(false);

  useEffect(() => {
    setEditing(null);
    setClearing(null);
  }, [clientId]);

  if (!client || !rep) {
    return (
      <section className="page">
        <Crumbs />
        <div className="empty">
          <h1>That client is not on the shared boards</h1>
          <p>
            <a href="#/">Back to reps</a>
          </p>
        </div>
      </section>
    );
  }

  const progress = progressFor(client);
  const core = progress.pieces.filter((piece) => piece.group === "core").slice(0, corePieceCount());
  const extras = progress.pieces.filter((piece) => piece.group === "extra");
  const lifeIds = new Set<string>(LIFE_PIECE_IDS);
  const ipaIds = new Set<string>(IPA_PIECE_IDS);
  const lifePieces = extras.filter((piece) => lifeIds.has(piece.id));
  const ipaPieces = extras.filter((piece) => ipaIds.has(piece.id));
  const statePieces = extras.filter((piece) => !lifeIds.has(piece.id) && !ipaIds.has(piece.id));
  const ipaForced = ipaRequired(client.state);
  const fasanoHref = safeHref(lifePieces.find((piece) => piece.id === "fasano")?.formUrl);
  const done = progress.total > 0 && progress.missing.length === 0;

  function saveLink(piece: PieceDef, url: string, label: string) {
    const error = store.setLink(client!.id, piece.id, url, label);
    if (error) return error;
    store.notify(`Link saved for ${piece.label}.`);
    setEditing(null);
    return null;
  }

  function dropLink(piece: PieceDef, url: string) {
    const error = store.setLink(client!.id, piece.id, url, "");
    if (error) store.notify(error);
    else store.notify(`Link saved for ${piece.label}.`);
  }

  return (
    <section className="page">
      <Crumbs rep={rep} client={client} />
      <div className="page-head">
        <div>
          <h1>
            {client.name}
            {(ipaForced || client.ipa) && <span className="ipa-badge">IPA</span>}
            {client.lifeContingent && <span className="life-badge">Life contingent</span>}
          </h1>
          <p>
            Click a piece to paste an https link, or drag a link onto it. {progress.filled} of {progress.total} complete.
          </p>
        </div>
        <div className="button-row">
          <button type="button" className="btn ghost" onClick={() => setAdvance(true)}>
            Generate advance doc
          </button>
          <button type="button" className="btn ghost" onClick={() => setRenaming(true)}>
            Rename
          </button>
          <button type="button" className="btn ghost" onClick={() => setMoving(true)}>
            Move
          </button>
          <button type="button" className="btn danger" onClick={() => setDeleting(true)}>
            Delete
          </button>
        </div>
      </div>

      <form className="meta-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          State
          <select value={client.state} onChange={(event) => store.updateClient(client.id, { state: event.target.value })}>
            <option value="">Select a state</option>
            {stateOptions().map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Insurance company
          <select
            value={client.insurer}
            onChange={(event) => store.updateClient(client.id, { insurer: event.target.value })}
          >
            <option value="">Select an insurer</option>
            {insurerOptions().map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Deal type</legend>
          <label className="checkline">
            <input
              type="radio"
              name={`deal-${client.id}`}
              checked={client.dealType === "structured"}
              onChange={() => store.updateClient(client.id, { dealType: "structured" satisfies DealType })}
            />
            Structured settlement
          </label>
          <label className="checkline">
            <input
              type="radio"
              name={`deal-${client.id}`}
              checked={client.dealType === "spia"}
              onChange={() => store.updateClient(client.id, { dealType: "spia" })}
            />
            SPIA
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={client.lifeContingent}
              onChange={(event) => store.updateClient(client.id, { lifeContingent: event.target.checked })}
            />
            Life contingent
          </label>
          <label className="checkline">
            <input
              type="checkbox"
              checked={ipaForced || client.ipa}
              disabled={ipaForced}
              onChange={(event) => {
                if (!ipaForced) store.updateClient(client.id, { ipa: event.target.checked });
              }}
            />
            IPA
          </label>
          {ipaForced && <p className="hint ipa-note">IPA required in {stateName(client.state)}</p>}
        </fieldset>
      </form>

      <CopyLinks client={client} pieces={progress.pieces} />

      <div className="board-layout">
        <div>
          <div className="status" aria-live="polite">
            <div>
              <p className="status-count">
                {progress.filled} of {progress.total} complete
              </p>
              {extras.length > 0 && (
                <p className="hint">
                  Standard {corePieceCount()}, plus {extras.length} more for this file.
                </p>
              )}
              <Meter filled={progress.filled} total={progress.total} />
            </div>
            <div>
              <h2>Missing</h2>
              {progress.missing.length === 0 ? (
                <p>All required documents have a link.</p>
              ) : (
                <ul className="missing">
                  {progress.missing.map((piece) => (
                    <li key={piece.id}>
                      <button type="button" onClick={() => setEditing(piece)}>
                        {piece.label}
                      </button>
                      {piece.group === "extra" && <span className="tag">Added</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {done && <p className="complete-banner">All required links are in. The picture is complete.</p>}

          <PuzzleBoard
            pieces={core}
            links={client.links}
            complete={done}
            onEdit={setEditing}
            onClear={setClearing}
            onDropLink={dropLink}
            onReject={(message) => store.notify(message)}
          />

          <div className="extra-block">
            <h2>State and insurer documents</h2>
            {statePieces.length === 0 ? (
              <p className="hint">
                {client.state || client.insurer
                  ? "No extra documents for this selection. The standard 11 still apply."
                  : "Set a state or insurer if this file needs anything beyond the standard 11."}
              </p>
            ) : (
              <>
                <p className="hint">These pieces are added from the state and insurer rules. They count toward the total.</p>
                <ExtraStrip
                  pieces={statePieces}
                  links={client.links}
                  onEdit={setEditing}
                  onClear={setClearing}
                  onDropLink={dropLink}
                  onReject={(message) => store.notify(message)}
                />
              </>
            )}
          </div>

          {ipaPieces.length > 0 && (
            <div className="extra-block">
              <h2>IPA</h2>
              <p className="hint">
                {ipaForced
                  ? `IPA required in ${stateName(client.state)}. These two count toward the total.`
                  : "These two count toward the total. Turning IPA off hides them and keeps any links already saved."}
              </p>
              <ExtraStrip
                pieces={ipaPieces}
                links={client.links}
                onEdit={setEditing}
                onClear={setClearing}
                onDropLink={dropLink}
                onReject={(message) => store.notify(message)}
              />
            </div>
          )}

          {lifePieces.length > 0 && (
            <div className="extra-block">
              <h2>Life contingent documents</h2>
              <p className="hint">
                These four count toward the total. Turning Life contingent off hides them and keeps any links already saved.
              </p>
              <ExtraStrip
                pieces={lifePieces}
                links={client.links}
                onEdit={setEditing}
                onClear={setClearing}
                onDropLink={dropLink}
                onReject={(message) => store.notify(message)}
              />
              {fasanoHref && (
                <p className="hint form-ref">
                  Blank Fasano template:{" "}
                  <a href={fasanoHref} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                    Open
                  </a>
                  . This is the company form, not this client&apos;s document.
                </p>
              )}
            </div>
          )}

          <ol className="doc-list">
            {progress.pieces.map((piece) => {
              const link = client.links[piece.id];
              return (
                <li key={piece.id}>
                  <div>
                    <strong>{piece.label}</strong>
                    <span>{link ? `${link.label} · ${linkStamp(link)}` : "No link yet"}</span>
                  </div>
                  <div className="button-row">
                    <button type="button" className="btn ghost" onClick={() => setEditing(piece)}>
                      {link ? "Edit" : "Paste link"}
                    </button>
                    {link && (
                      <a className="btn ghost" href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                        Open
                      </a>
                    )}
                    {link && (
                      <button type="button" className="btn ghost" onClick={() => setClearing(piece)}>
                        Clear
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <StateForms stateCode={client.state} />
          <Guidance client={client} />
        </div>
      </div>

      <AdvanceDialog open={advance} clientName={client.name} onClose={() => setAdvance(false)} />
      {editing && (
        <LinkDialog
          key={`${editing.id}:${client.links[editing.id]?.url ?? ""}`}
          piece={editing}
          link={client.links[editing.id]}
          onClose={() => setEditing(null)}
          onSave={(url, label) => saveLink(editing, url, label)}
          onClear={() => {
            setClearing(editing);
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(clearing)}
        title={`Remove the link for ${clearing?.label ?? "this piece"}?`}
        body="The address is removed for everyone. The file on the shared drive is not touched."
        confirmLabel="Clear link"
        danger
        onClose={() => setClearing(null)}
        onConfirm={() => {
          if (!clearing) return;
          store.clearLink(client.id, clearing.id);
          store.notify(`Cleared ${clearing.label}.`);
          setClearing(null);
        }}
      />
      <NameDialog
        open={renaming}
        title="Rename client"
        label="Client name"
        initial={client.name}
        confirmLabel="Save"
        onClose={() => setRenaming(false)}
        onSubmit={(value) => store.renameClient(client.id, value)}
      />
      <MoveDialog
        open={moving}
        reps={store.reps}
        currentRepId={client.repId}
        onClose={() => setMoving(false)}
        onMove={(repId) => {
          store.moveClient(client.id, repId);
          store.notify("Client moved.");
          setMoving(false);
        }}
      />
      <ConfirmDialog
        open={deleting}
        title={`Delete ${client.name}?`}
        body="This client and their links will be removed for everyone. Files on the shared drive are not touched."
        confirmLabel="Delete client"
        danger
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          const repId = client.repId;
          store.deleteClient(client.id);
          store.notify(`${client.name} was removed from the shared boards.`);
          location.hash = repHref(repId);
        }}
      />
    </section>
  );
}
