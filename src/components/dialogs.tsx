import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { insurerOptions, ipaRequired, stateName, stateOptions } from "../config/catalog";
import { formatAdded, parseHttpsUrl } from "../lib/links";
import { safeHref } from "./Puzzle";
import type { DealType, LinkRecord, PieceDef } from "../types";

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      el.querySelector<HTMLElement>("input, select, button")?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className={wide ? "modal modal-wide" : "modal"}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p>{body}</p>
      <div className="modal-actions">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={danger ? "btn danger" : "btn"} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function NameDialog({
  open,
  title,
  label,
  initial,
  confirmLabel,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  initial?: string;
  confirmLabel: string;
  onSubmit: (value: string) => string | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  useEffect(() => {
    if (open) {
      setValue(initial ?? "");
      setError(null);
    }
  }, [open, initial]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = onSubmit(value);
    if (result) setError(result);
    else onClose();
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <label htmlFor={id}>{label}</label>
        <input id={id} value={value} onChange={(event) => setValue(event.target.value)} maxLength={120} required />
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ClientDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; state: string; insurer: string; dealType: DealType; lifeContingent: boolean; ipa: boolean }) => string | null;
}) {
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [insurer, setInsurer] = useState("");
  const [dealType, setDealType] = useState<DealType>("structured");
  const [lifeContingent, setLifeContingent] = useState(false);
  const [ipa, setIpa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();
  useEffect(() => {
    if (open) {
      setName("");
      setState("");
      setInsurer("");
      setDealType("structured");
      setLifeContingent(false);
      setIpa(false);
      setError(null);
    }
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = onCreate({ name, state, insurer, dealType, lifeContingent, ipa });
    if (result) setError(result);
    else onClose();
  }

  return (
    <Modal open={open} title="Add client" onClose={onClose}>
      <form onSubmit={submit}>
        <label htmlFor={nameId}>Client name</label>
        <input id={nameId} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
        <label htmlFor={`${nameId}-state`}>State</label>
        <select id={`${nameId}-state`} value={state} onChange={(event) => setState(event.target.value)}>
          <option value="">Select later</option>
          {stateOptions().map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
        <label htmlFor={`${nameId}-insurer`}>Insurance company</label>
        <select id={`${nameId}-insurer`} value={insurer} onChange={(event) => setInsurer(event.target.value)}>
          <option value="">Select later</option>
          {insurerOptions().map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
        <label className="checkline">
          <input
            type="checkbox"
            checked={dealType === "spia"}
            onChange={(event) => setDealType(event.target.checked ? "spia" : "structured")}
          />
          SPIA
        </label>
        <p className="hint">Single premium immediate annuity. Hold Time, its DocuSign summary, and IPA are not required.</p>
        <label className="checkline">
          <input type="checkbox" checked={lifeContingent} onChange={(event) => setLifeContingent(event.target.checked)} />
          Life contingent
        </label>
        <p className="hint">Adds Life Affidavit, 2 Person Notifier, Fasano, DocuCert for Fasano, and Life Expectancy Doc.</p>
        <label className="checkline">
          <input
            type="checkbox"
            checked={dealType !== "spia" && (ipaRequired(state) || ipa)}
            disabled={dealType === "spia" || ipaRequired(state)}
            onChange={(event) => setIpa(event.target.checked)}
          />
          IPA
        </label>
        <p className="hint">
          {dealType === "spia"
            ? "IPA not needed for SPIA"
            : ipaRequired(state)
              ? `IPA required in ${stateName(state)}. Adds IPA Invoice and IPA W9.`
              : "Adds IPA Invoice and IPA W9. Optional unless the state requires it."}
        </p>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            Create board
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function LinkDialog({
  piece,
  link,
  onClose,
  onSave,
  onClear,
}: {
  piece: PieceDef;
  link?: LinkRecord;
  onClose: () => void;
  onSave: (url: string, label: string) => string | null;
  onClear: () => void;
}) {
  const [url, setUrl] = useState(link?.url ?? "");
  const [label, setLabel] = useState(link?.labelIsCustom ? link.label : "");
  const [error, setError] = useState<string | null>(null);
  const urlId = useId();
  const formHref = safeHref(piece.formUrl);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = onSave(url, label);
    if (result) setError(result);
  }

  return (
    <Modal open title={link ? `Edit ${piece.label}` : piece.label} onClose={onClose}>
      <p className="hint">{piece.hint} Paste the https address. Progrum does not open or download the file.</p>
      {formHref && piece.formLabel && (
        <p className="hint">
          <a href={formHref} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            {piece.formLabel}
          </a>
          . That is the blank company form, not this client's document.
        </p>
      )}
      <form onSubmit={submit}>
        <label htmlFor={urlId}>https link</label>
        <input
          id={urlId}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
          autoComplete="off"
        />
        <label htmlFor={`${urlId}-label`}>Display name (optional)</label>
        <input
          id={`${urlId}-label`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={80}
          placeholder={url && parseHttpsUrl(url).ok ? "Uses the site or file name if left blank" : "Optional"}
        />
        {link && <p className="hint">Added {formatAdded(link.addedAt)}.</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          {link && (
            <button type="button" className="btn ghost danger-text" onClick={onClear}>
              Clear
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn">
            Save link
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function MoveDialog({
  open,
  reps,
  currentRepId,
  onClose,
  onMove,
}: {
  open: boolean;
  reps: { id: string; name: string }[];
  currentRepId: string;
  onClose: () => void;
  onMove: (repId: string) => void;
}) {
  const others = reps.filter((rep) => rep.id !== currentRepId);
  const [repId, setRepId] = useState(others[0]?.id ?? "");
  const id = useId();
  useEffect(() => {
    if (open) setRepId(others[0]?.id ?? "");
    // others is a fresh array each render; the open flag is the reset signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} title="Move client" onClose={onClose}>
      {others.length === 0 ? (
        <>
          <p>Add another rep before moving this client.</p>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (repId) onMove(repId);
          }}
        >
          <label htmlFor={id}>Rep</label>
          <select id={id} value={repId} onChange={(event) => setRepId(event.target.value)}>
            {others.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Move
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
