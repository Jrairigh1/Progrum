import { useEffect, useRef, useState } from "react";
import { stateFormsFor } from "../config/catalog";
import { buildCopyText, writeClipboard } from "../lib/copyLinks";
import type { Client, PieceDef } from "../types";

export function CopyLinks({ client, pieces }: { client: Client; pieces: PieceDef[] }) {
  const [includeMissing, setIncludeMissing] = useState(false);
  const [includeForms, setIncludeForms] = useState(false);
  const [notice, setNotice] = useState("");
  const [fallback, setFallback] = useState("");
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const forms = stateFormsFor(client.state).filter((form) => form.url.startsWith("https://"));

  useEffect(() => {
    if (!fallback) return;
    boxRef.current?.focus();
    boxRef.current?.select();
  }, [fallback]);

  async function copy() {
    const filled = pieces.flatMap((piece) => {
      const link = client.links[piece.id];
      return link?.url ? [{ label: piece.label, url: link.url }] : [];
    });
    const missingLabels = pieces.filter((piece) => !client.links[piece.id]?.url).map((piece) => piece.label);
    const { plain, html } = buildCopyText({
      clientName: client.name,
      bestContactNumber: client.bestContactNumber,
      timeAtAddress: client.timeAtAddress,
      filled,
      missingLabels,
      includeMissing,
      stateForms: forms.map((form) => ({ label: form.name, url: form.url })),
      includeStateForms: includeForms,
    });
    const result = await writeClipboard(plain, html);
    if (result === "fallback") {
      setFallback(plain);
      setNotice("Select the text below and copy it.");
      return;
    }
    setFallback("");
    setNotice(result === "copied" ? "Copied" : "Copied as plain text");
    window.setTimeout(() => setNotice(""), 2500);
  }

  return (
    <div className="copy-bar">
      <button type="button" className="btn" onClick={() => void copy()}>
        Copy all links
      </button>
      <label className="checkline">
        <input type="checkbox" checked={includeMissing} onChange={(event) => setIncludeMissing(event.target.checked)} />
        Still needed
      </label>
      <label className="checkline">
        <input
          type="checkbox"
          checked={includeForms}
          disabled={forms.length === 0}
          onChange={(event) => setIncludeForms(event.target.checked)}
        />
        State forms
      </label>
      {notice && (
        <p className="copy-notice" role="status">
          {notice}
        </p>
      )}
      {fallback && (
        <textarea ref={boxRef} className="copy-fallback" readOnly value={fallback} aria-label="Links to copy" rows={8} />
      )}
    </div>
  );
}

export function StateForms({ stateCode }: { stateCode: string }) {
  const forms = stateFormsFor(stateCode).filter((form) => form.url.startsWith("https://"));
  return (
    <section className="state-forms">
      <h2>State forms</h2>
      {forms.length === 0 ? (
        <p className="hint">
          {stateCode
            ? "CBCisstant has no blank template link for this state."
            : "Choose a state to see its blank templates."}
        </p>
      ) : (
        <>
          <p className="hint">Blank templates to send or fill. These are not this client’s documents.</p>
          <ul>
            {forms.map((form) => (
              <li key={form.url}>
                <span>{form.name}</span>
                <a href={form.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                  Open
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
