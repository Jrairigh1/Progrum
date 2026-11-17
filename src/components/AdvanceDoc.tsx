import { useEffect, useId, useState } from "react";
import { QUICK_LINKS, WIRE_FEE } from "../config/catalog";
import {
  downloadBytes,
  formatPlainAmount,
  loadAdvanceTemplate,
  previewAdvance,
  renderAdvanceDoc,
  todayLetterDate,
} from "../lib/advanceDoc";
import { Modal } from "./dialogs";

function startingFee(wire: boolean): string {
  if (!wire) return "0.00";
  return WIRE_FEE === null ? "" : formatPlainAmount(WIRE_FEE);
}

export function QuickLinks({ onAdvance }: { onAdvance: () => void }) {
  return (
    <section className="quick-links">
      <div className="quick-links-head">
        <div>
          <h2>Quick links</h2>
          <p className="hint">Blank company documents from CBCisstant. Progrum does not fetch or open them until you choose Open.</p>
        </div>
        <button type="button" className="btn" onClick={onAdvance}>
          Advance document
        </button>
      </div>
      <ul>
        {QUICK_LINKS.map((link) => (
          <li key={link.label}>
            <span>{link.label}</span>
            <a href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
              Open
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdvanceDialog({
  open,
  clientName,
  onClose,
}: {
  open: boolean;
  clientName?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(clientName ?? "");
  const [amount, setAmount] = useState("");
  const [wire, setWire] = useState(false);
  const [fee, setFee] = useState(startingFee(false));
  const [date, setDate] = useState(todayLetterDate());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameId = useId();
  const preview = previewAdvance({ clientName: name, amountRaw: amount, feeRaw: fee, wire, date });

  useEffect(() => {
    if (!open) return;
    setName(clientName ?? "");
    setAmount("");
    setWire(false);
    setFee(startingFee(false));
    setDate(todayLetterDate());
    setError(null);
    setBusy(false);
  }, [open, clientName]);

  function chooseWire(next: boolean) {
    setWire(next);
    setFee(startingFee(next));
  }

  async function download() {
    if (!preview.ok) {
      setError(preview.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const template = await loadAdvanceTemplate();
      const bytes = renderAdvanceDoc(template, preview.preview);
      downloadBytes(bytes, preview.preview.fileName);
    } catch {
      setError("The advance letter could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Advance document" onClose={onClose}>
      <p className="hint">
        The letter is created in this browser and downloaded to this computer. It is not saved on the shared boards.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void download();
        }}
      >
        <label htmlFor={nameId}>Client name</label>
        <input id={nameId} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
        <label htmlFor={`${nameId}-amount`}>Amount to advance (to client)</label>
        <input
          id={`${nameId}-amount`}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="2000"
          required
        />
        <fieldset>
          <legend>Is it a wire?</legend>
          <label className="checkline">
            <input type="radio" name={`${nameId}-wire`} checked={!wire} onChange={() => chooseWire(false)} />
            No
          </label>
          <label className="checkline">
            <input type="radio" name={`${nameId}-wire`} checked={wire} onChange={() => chooseWire(true)} />
            Yes
          </label>
        </fieldset>
        <label htmlFor={`${nameId}-fee`}>{wire ? "Wire fee" : "FedEx fee"}</label>
        <input
          id={`${nameId}-fee`}
          inputMode="decimal"
          value={fee}
          onChange={(event) => setFee(event.target.value)}
          placeholder={wire && WIRE_FEE === null ? "Type the wire fee" : "0.00"}
          required
        />
        <label htmlFor={`${nameId}-date`}>Date</label>
        <input id={`${nameId}-date`} value={date} onChange={(event) => setDate(event.target.value)} placeholder="M/D/YYYY" required />
        {preview.ok ? (
          <dl className="advance-preview">
            <div>
              <dt>Date</dt>
              <dd>{preview.preview.date}</dd>
            </div>
            <div>
              <dt>Amount to client</dt>
              <dd>{preview.preview.amountToClient}</dd>
            </div>
            <div>
              <dt>{preview.preview.feeLabel}</dt>
              <dd>{preview.preview.feeMoney}</dd>
            </div>
            <div>
              <dt>Advance amount</dt>
              <dd>{preview.preview.advanceAmount}</dd>
            </div>
            <div>
              <dt>File</dt>
              <dd>{preview.preview.fileName}</dd>
            </div>
          </dl>
        ) : (
          <p className="hint">{preview.error}</p>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn" disabled={!preview.ok || busy}>
            {busy ? "Preparing" : "Download"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
