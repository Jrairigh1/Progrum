import { guidanceFor } from "../lib/guidance";
import type { Client } from "../types";

export function Guidance({ client }: { client: Client }) {
  const model = guidanceFor(client);
  const empty = !model.stateTitle && !model.insurerTitle && model.alerts.length === 0;

  return (
    <aside className="guidance">
      <h2>File guidance</h2>
      {empty && (
        <p className="hint">
          Choose a state and an insurance company to see rate caps, hold time, court notes, and any extra documents.
        </p>
      )}
      {model.alerts.map((alert) => (
        <div key={alert.title} className={`alert ${alert.tone}`}>
          <strong>{alert.title}</strong>
          <p>{alert.body}</p>
        </div>
      ))}
      {model.stateTitle && (
        <section>
          <h3>{model.stateTitle}</h3>
          <dl>
            {model.stateRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  {row.value}
                  {row.detail && <small>{row.detail}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {model.insurerTitle && (
        <section>
          <h3>{model.insurerTitle}</h3>
          <dl>
            {model.insurerRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  {row.value}
                  {row.detail && <small>{row.detail}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {model.costs && (
        <section>
          <h3>Estimated costs</h3>
          <dl>
            {model.costs.lines.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            {model.costs.total && (
              <div>
                <dt>Estimated total</dt>
                <dd>{model.costs.total}</dd>
              </div>
            )}
          </dl>
          {model.costs.note && <p className="hint">{model.costs.note}</p>}
        </section>
      )}
      <p className="hint source-note">
        Rules are company reference data from CBCisstant. They are not a client file, and Progrum does not send them anywhere.
      </p>
    </aside>
  );
}
