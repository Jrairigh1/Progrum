import { useMemo, useState } from "react";
import { clientInsurerLabel, stateName, stateOptions } from "../config/catalog";
import { progressFor } from "../lib/clients";
import { clientHref } from "../lib/routing";
import { useStore } from "../store";
import { Crumbs, Meter } from "./ui";

function fundedDay(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fundedLabel(iso: string | undefined): string {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function FundedPage() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [repId, setRepId] = useState("");
  const [state, setState] = useState("");
  const [day, setDay] = useState("");
  const funded = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return store.clients
      .filter((client) => client.funded)
      .filter((client) => !repId || client.repId === repId)
      .filter((client) => !state || client.state === state)
      .filter((client) => !day || fundedDay(client.fundedAt) === day)
      .filter((client) => !needle || client.name.toLowerCase().includes(needle))
      .sort((a, b) => (b.fundedAt || "").localeCompare(a.fundedAt || ""));
  }, [store.clients, query, repId, state, day]);

  return (
    <section className="page">
      <Crumbs />
      <div className="page-head">
        <div>
          <h1>Funded</h1>
          <p>Funded boards stay with their rep. They are hidden from that rep's active list.</p>
        </div>
      </div>
      <form className="funded-filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          Name
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" />
        </label>
        <label>
          Rep
          <select value={repId} onChange={(event) => setRepId(event.target.value)}>
            <option value="">All reps</option>
            {[...store.reps].sort((a, b) => a.name.localeCompare(b.name)).map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          State
          <select value={state} onChange={(event) => setState(event.target.value)}>
            <option value="">All states</option>
            {stateOptions().map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Funded date
          <input type="date" value={day} onChange={(event) => setDay(event.target.value)} />
        </label>
      </form>
      {funded.length === 0 ? (
        <div className="empty">
          <h2>No funded boards</h2>
          <p>Mark a client as funded from their board. The board is kept.</p>
        </div>
      ) : (
        <div className="list">
          {funded.map((client) => {
            const rep = store.reps.find((item) => item.id === client.repId);
            const progress = progressFor(client);
            return (
              <article key={client.id} className="row-card">
                <a className="row-main" href={clientHref(client.id)}>
                  <div>
                    <h2>{client.name}</h2>
                    <p className="quiet">
                      {rep?.name ?? "Unknown rep"}
                      {" · "}
                      {client.state ? stateName(client.state) : "No state"}
                      {" · "}
                      {clientInsurerLabel(client)}
                      {" · "}
                      {fundedLabel(client.fundedAt)}
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
