import { useState } from "react";
import { clientInsurerLabel, ipaRequired, stateName } from "../config/catalog";
import { compareNames, progressFor } from "../lib/clients";
import { clientHref } from "../lib/routing";
import { useStore } from "../store";
import { ClientDialog, ConfirmDialog, MoveDialog, NameDialog } from "./dialogs";
import { Crumbs, Meter } from "./ui";

export function ClientsPage({ repId }: { repId: string }) {
  const store = useStore();
  const rep = store.reps.find((item) => item.id === repId) ?? null;
  const [adding, setAdding] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  if (!rep) {
    return (
      <section className="page">
        <Crumbs />
        <div className="empty">
          <h1>That rep is not on the shared boards</h1>
          <p>
            <a href="#/">Back to reps</a>
          </p>
        </div>
      </section>
    );
  }
  const clients = store.clients.filter((client) => client.repId === rep.id && !client.funded).sort((a, b) => compareNames(a.name, b.name));
  const fundedHere = store.clients.some((client) => client.repId === rep.id && client.funded);
  const renaming = clients.find((client) => client.id === renameId) ?? null;
  const moving = clients.find((client) => client.id === moveId) ?? null;
  const deleting = clients.find((client) => client.id === deleteId) ?? null;

  return (
    <section className="page">
      <Crumbs rep={rep} />
      <div className="page-head">
        <div>
          <h1>{rep.name}</h1>
          <p>Each client has a puzzle of the documents the file needs. A piece is a link, not a copy of the file.</p>
        </div>
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          Add client
        </button>
      </div>
      {clients.length === 0 ? (
        <div className="empty">
          {fundedHere ? (
            <>
              <h2>No active clients</h2>
              <p>Funded boards for {rep.name} are in the Funded bin.</p>
            </>
          ) : (
            <>
              <h2>No clients yet</h2>
              <p>Add the first file for {rep.name}.</p>
            </>
          )}
        </div>
      ) : (
        <div className="list">
          {clients.map((client) => {
            const progress = progressFor(client);
            return (
              <article key={client.id} className="row-card">
                <a className="row-main" href={clientHref(client.id)}>
                  <div>
                    <h2>
                      {client.name}
                      {client.dealType === "spia" && <span className="spia-badge">SPIA</span>}
                      {client.laAbuse && <span className="la-badge">LA abuse</span>}
                      {client.dealType !== "spia" && (ipaRequired(client.state) || client.ipa) && <span className="ipa-badge">IPA</span>}
                      {client.lifeContingent && <span className="life-badge">Life contingent</span>}
                      {client.estate && <span className="estate-badge">Estate</span>}
                      {client.poa && <span className="poa-badge">POA</span>}
                    </h2>
                    <p className="quiet">
                      {client.state ? stateName(client.state) : "No state"}
                      {" · "}
                      {clientInsurerLabel(client)}
                    </p>
                  </div>
                  <div className="row-progress">
                    <strong>
                      {progress.filled} of {progress.total}
                    </strong>
                    <span>{progress.missing.length === 0 ? "Complete" : `${progress.missing.length} missing`}</span>
                    <Meter filled={progress.filled} total={progress.total} />
                  </div>
                </a>
                <div className="card-actions">
                  <button type="button" onClick={() => setRenameId(client.id)}>
                    Rename
                  </button>
                  <button type="button" onClick={() => setMoveId(client.id)}>
                    Move
                  </button>
                  <button type="button" className="danger-text" onClick={() => setDeleteId(client.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ClientDialog
        open={adding}
        onClose={() => setAdding(false)}
        onCreate={(input) => {
          const result = store.addClient({ ...input, repId: rep.id });
          if ("error" in result) return result.error;
          location.hash = clientHref(result.id);
          return null;
        }}
      />
      <NameDialog
        open={Boolean(renaming)}
        title="Rename client"
        label="Client name"
        initial={renaming?.name}
        confirmLabel="Save"
        onClose={() => setRenameId(null)}
        onSubmit={(value) => (renaming ? store.renameClient(renaming.id, value) : null)}
      />
      <MoveDialog
        open={Boolean(moving)}
        reps={store.reps}
        currentRepId={rep.id}
        onClose={() => setMoveId(null)}
        onMove={(nextRep) => {
          if (!moving) return;
          store.moveClient(moving.id, nextRep);
          const name = store.reps.find((item) => item.id === nextRep)?.name ?? "the other rep";
          store.notify(`${moving.name} now sits with ${name}.`);
          setMoveId(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "client"}?`}
        body="This client and their links will be removed for everyone. Files on the shared drive are not touched."
        confirmLabel="Delete client"
        danger
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleting) return;
          store.deleteClient(deleting.id);
          store.notify(`${deleting.name} was removed from the shared boards.`);
          setDeleteId(null);
        }}
      />
    </section>
  );
}
