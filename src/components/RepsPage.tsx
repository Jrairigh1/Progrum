import { useState } from "react";
import { compareNames, sumProgress } from "../lib/clients";
import { fundedHref, repHref } from "../lib/routing";
import { useStore } from "../store";
import { AdvanceDialog, QuickLinks } from "./AdvanceDoc";
import { ConfirmDialog, NameDialog } from "./dialogs";
import { Meter, Ring } from "./ui";

export function RepsPage() {
  const store = useStore();
  const [adding, setAdding] = useState(false);
  const [advance, setAdvance] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const reps = [...store.reps].sort((a, b) => compareNames(a.name, b.name));
  const renaming = reps.find((rep) => rep.id === renameId) ?? null;
  const deleting = reps.find((rep) => rep.id === deleteId) ?? null;
  const deleteCount = deleting ? store.clients.filter((client) => client.repId === deleting.id).length : 0;

  return (
    <section className="page reps-layout">
      <div className="reps-main">
      <div className="page-head">
        <div>
          <h1>Sales reps</h1>
          <p>These boards are shared live. Anyone with this link can view and edit them. James is here when the list is new.</p>
        </div>
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          Add rep
        </button>
      </div>
      {reps.length === 0 ? (
        <div className="empty">
          <h2>No reps yet</h2>
          <p>Add a rep to start a book. The new rep shows up for everyone with this link.</p>
        </div>
      ) : (
        <div className="card-grid">
          {reps.map((rep) => {
            const clients = store.clients.filter((client) => client.repId === rep.id && !client.funded);
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
      <p className="funded-link">
        <a href={fundedHref()}>Funded ({store.clients.filter((client) => client.funded).length})</a>
      </p>
      </div>
      <QuickLinks onAdvance={() => setAdvance(true)} />
      <AdvanceDialog open={advance} onClose={() => setAdvance(false)} />
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
            ? `This removes the rep and ${deleteCount} client board${deleteCount === 1 ? "" : "s"} for everyone. Files on the shared drive are not touched.`
            : "This removes the rep for everyone. Files on the shared drive are not touched."
        }
        confirmLabel="Delete rep"
        danger
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleting) return;
          store.deleteRep(deleting.id);
          store.notify(`${deleting.name} was removed from the shared boards.`);
          setDeleteId(null);
        }}
      />
    </section>
  );
}
