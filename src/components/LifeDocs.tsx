import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { downloadBytes, loadTemplate, todayLetterDate } from "../lib/advanceDoc";
import { buildContinuedContact, EMPTY_CONTACT, renderContinuedContact, type ContactPerson } from "../lib/continuedContact";
import { buildLifeAffidavit, LIFE_QUESTIONS, renderLifeAffidavit, type YesNo } from "../lib/lifeAffidavit";
import { Modal } from "./dialogs";

function freshAnswers(): Array<YesNo | ""> {
  return LIFE_QUESTIONS.map(() => "");
}

export function LifeAffidavitDialog({
  open,
  clientName,
  onClose,
}: {
  open: boolean;
  clientName?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(clientName ?? "");
  const [answers, setAnswers] = useState<Array<YesNo | "">>(freshAnswers);
  const [date, setDate] = useState(todayLetterDate());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameId = useId();
  const built = buildLifeAffidavit({ clientName: name, answers, date });

  useEffect(() => {
    if (!open) return;
    setName(clientName ?? "");
    setAnswers(freshAnswers());
    setDate(todayLetterDate());
    setError(null);
    setBusy(false);
  }, [open, clientName]);

  async function download() {
    const next = buildLifeAffidavit({ clientName: name, answers, date });
    if (!next.ok) {
      setError(next.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const template = await loadTemplate("life-affidavit-template.docx");
      downloadBytes(renderLifeAffidavit(template, next.data, next.prepare), next.fileName);
    } catch {
      setError("The life affidavit could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Life Affidavit" onClose={onClose} wide>
      <p className="hint">
        Choose Yes or No for every question. The letter is created in this browser and is not saved on the shared boards.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void download();
        }}
      >
        <label htmlFor={nameId}>Client name</label>
        <input id={nameId} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
        <div className="q-list">
          {LIFE_QUESTIONS.map((question, index) => (
            <div className="q-row" key={question}>
              <p>
                {index + 1}. {question}
              </p>
              <fieldset aria-label={question}>
                <label className="checkline">
                  <input
                    type="radio"
                    name={`${nameId}-q${index}`}
                    checked={answers[index] === "yes"}
                    onChange={() => setAnswers((current) => current.map((answer, item) => (item === index ? "yes" : answer)))}
                  />
                  Yes
                </label>
                <label className="checkline">
                  <input
                    type="radio"
                    name={`${nameId}-q${index}`}
                    checked={answers[index] === "no"}
                    onChange={() => setAnswers((current) => current.map((answer, item) => (item === index ? "no" : answer)))}
                  />
                  No
                </label>
              </fieldset>
            </div>
          ))}
        </div>
        <label htmlFor={`${nameId}-date`}>Date</label>
        <input
          id={`${nameId}-date`}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          placeholder="M/D/YYYY, or blank"
        />
        <p className="hint">Clear the date to leave that line blank.</p>
        {built.ok ? (
          <p className="hint">File: {built.fileName}</p>
        ) : (
          <p className="hint">{built.error}</p>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn" disabled={!built.ok || busy}>
            {busy ? "Preparing" : "Download"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ContinuedContactDialog({
  open,
  clientName,
  onClose,
}: {
  open: boolean;
  clientName?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(clientName ?? "");
  const [fileNumber, setFileNumber] = useState("");
  const [first, setFirst] = useState<ContactPerson>(EMPTY_CONTACT);
  const [second, setSecond] = useState<ContactPerson>(EMPTY_CONTACT);
  const [date, setDate] = useState(todayLetterDate());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameId = useId();
  const built = buildContinuedContact({ clientName: name, fileNumber, first, second, date });

  useEffect(() => {
    if (!open) return;
    setName(clientName ?? "");
    setFileNumber("");
    setFirst(EMPTY_CONTACT);
    setSecond(EMPTY_CONTACT);
    setDate(todayLetterDate());
    setError(null);
    setBusy(false);
  }, [open, clientName]);

  async function download(event: FormEvent) {
    event.preventDefault();
    const next = buildContinuedContact({ clientName: name, fileNumber, first, second, date });
    if (!next.ok) {
      setError(next.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const template = await loadTemplate("continued-contact-template.docx");
      downloadBytes(renderContinuedContact(template, next.data), next.fileName);
    } catch {
      setError("The designation could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="2 Person Notifier" onClose={onClose} wide>
      <p className="hint">
        Designation of Continued Contact. This form is created in this browser and is not saved on the shared boards.
      </p>
      <form onSubmit={(event) => void download(event)}>
        <label htmlFor={nameId}>Seller's printed name</label>
        <input id={nameId} value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
        <label htmlFor={`${nameId}-file`}>CBC file number (optional)</label>
        <input id={`${nameId}-file`} value={fileNumber} onChange={(event) => setFileNumber(event.target.value)} maxLength={40} />
        <ContactFields title="Designated contact 1" person={first} onChange={setFirst} idPrefix={`${nameId}-c1`} />
        <ContactFields title="Designated contact 2" person={second} onChange={setSecond} idPrefix={`${nameId}-c2`} />
        <label htmlFor={`${nameId}-date`}>Date</label>
        <input
          id={`${nameId}-date`}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          placeholder="M/D/YYYY, or blank"
        />
        <p className="hint">Clear the date to leave that line blank. Fax and the file number can stay empty.</p>
        {built.ok ? <p className="hint">File: {built.fileName}</p> : <p className="hint">{built.error}</p>}
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="btn" disabled={!built.ok || busy}>
            {busy ? "Preparing" : "Download"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ContactFields({
  title,
  person,
  onChange,
  idPrefix,
}: {
  title: string;
  person: ContactPerson;
  onChange: (next: ContactPerson) => void;
  idPrefix: string;
}) {
  function set(key: keyof ContactPerson, value: string) {
    onChange({ ...person, [key]: value });
  }
  const fields: Array<[keyof ContactPerson, string, boolean]> = [
    ["name", "Name", true],
    ["address", "Address", true],
    ["city", "City", true],
    ["state", "State", true],
    ["zip", "ZIP code", true],
    ["phone", "Telephone", true],
    ["fax", "Fax (optional)", false],
    ["email", "Email", true],
    ["relationship", "Relationship", true],
  ];
  return (
    <div className="contact-block">
      <h3>{title}</h3>
      {fields.map(([key, label, required]) => (
        <label key={key} htmlFor={`${idPrefix}-${key}`}>
          {label}
          <input
            id={`${idPrefix}-${key}`}
            value={person[key]}
            onChange={(event) => set(key, event.target.value)}
            maxLength={120}
            required={required}
          />
        </label>
      ))}
    </div>
  );
}
