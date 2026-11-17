import { useState } from "react";
import { compareNames, sumProgress } from "../lib/clients";
import { repHref } from "../lib/routing";
import { useStore } from "../store";
import { ConfirmDialog, NameDialog } from "./dialogs";
import { Meter, Ring } from "./ui";

export function RepsPage() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const reps = [...store.reps].sort((a, b) => compareNames(a.name, b.name));
  const renaming = reps.find((rep) => rep.id === renameId) ?? null;
  const deleting = reps.find((rep) => rep.id === deleteId) ?? null;
  const deleteCount = deleting ? store.clients.filter((client) => client.repId === deleting.id).length : 0;

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Sales reps</h1>
          <p>
            {store.mode === "sharepoint"
              ? "These boards are shared with coworkers who sign in."
              : "Open a rep to see that book of clients. The first visit on this browser starts with James."}
          </p>
        </div>
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          Add rep
        </button>
      </div>
      {reps.length === 0 ? (
        <div className="empty">
          <h2>No reps on this browser</h2>
          <p>Add a rep to start a new book. Nothing is stored outside this browser.</p>
        </div>
      ) : (
        <div className="card-grid">
          {reps.map((rep) => {
            const clients = store.clients.filter((client) => client.repId === rep.id);
            const progress = sumProgress(clients);
            const ratio = progress.total === 0 ? 0 : progress.filled / progress.total;
            return (
              <article key={rep.id} className="card">
                <a className="card-main" href={repHref(rep.id)}>
                  <div className="card-title">
                    <h2>{rep.name}</h2>
                    <Ring value={ratio} />
                  </div>
                  <p className="quiet">
                    {clients.length} client{clients.length === 1 ? "" : "s"}
                  </p>
                  <p className="count">
                    {clients.length === 0 ? "No documents yet" : `${progress.filled} of ${progress.total} complete`}
                  </p>
                  <Meter filled={progress.filled} total={progress.total} />
                </a>
                <div className="card-actions">
                  <button type="button" onClick={() => setRenameId(rep.id)}>
                    Rename
                  </button>
                  <button type="button" className="danger-text" onClick={() => setDeleteId(rep.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <NameDialog
        open={adding}
        title="Add rep"
        label="Rep name"
        confirmLabel="Add rep"
        onClose={() => setAdding(false)}
        onSubmit={(value) => {
          const result = store.addRep(value);
          return "error" in result ? result.error : null;
        }}
      />
      <NameDialog
        open={Boolean(renaming)}
        title="Rename rep"
        label="Rep name"
        initial={renaming?.name}
        confirmLabel="Save"
        onClose={() => setRenameId(null)}
        onSubmit={(value) => (renaming ? store.renameRep(renaming.id, value) : null)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "rep"}?`}
        body={
          deleteCount
            ? `This removes the rep and ${deleteCount} client board${deleteCount === 1 ? "" : "s"} from ${store.mode === "sharepoint" ? "the shared boards" : "this browser"}. Files on the shared drive are not touched.`
            : `This removes the rep from ${store.mode === "sharepoint" ? "the shared boards" : "this browser"}.`
        }
        confirmLabel="Delete rep"
        danger
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleting) return;
          store.deleteRep(deleting.id);
          store.notify(`${deleting.name} was deleted from this browser.`);
          setDeleteId(null);
        }}
      />
    </section>
  );
}
