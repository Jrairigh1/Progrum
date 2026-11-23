import { useState } from "react";
import type { FormEvent } from "react";
import {
  CYCLE1_PER_POINT,
  FIVE_YEAR_PER_POINT,
  LA_ABUSE_HELP,
  laterCyclePayment,
  LATER_CYCLES,
  line6CrossCheck,
  type LaAbuseHelp,
} from "../config/laAbusePayments";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function readNumber(raw: string): number | null {
  const text = raw.trim().replace(/,/g, "");
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function LaAbuseCalculatorPage() {
  const [pointsRaw, setPointsRaw] = useState("");
  const [feeRaw, setFeeRaw] = useState("40");
  const [line6Raw, setLine6Raw] = useState("");
  const [openHelp, setOpenHelp] = useState<LaAbuseHelp["id"] | null>(null);

  function keepLocal(event: FormEvent) {
    event.preventDefault();
  }

  const points = readNumber(pointsRaw);
  const fee = readNumber(feeRaw);
  const line6 = line6Raw.trim() ? readNumber(line6Raw) : null;
  const pointsReady = points !== null && points > 0;
  const feeReady = fee !== null && fee <= 100;
  const line6Invalid = line6Raw.trim() !== "" && line6 === null;
  const estimate =
    points !== null && points > 0 && fee !== null && fee <= 100
      ? {
          points,
          cyclePayment: laterCyclePayment(points, fee),
          crossCheck: line6,
        }
      : null;

  return (
    <section className="page calc-page">
      <p className="crumbs">
        <a href="#/">Reps</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">LA Abuse Payment Calculator</span>
      </p>
      <div className="page-head">
        <div>
          <h1>LA Abuse Payment Calculator</h1>
          <p>
            Estimates cycle payments for the LA Child Victims Act Settlement Program, the LA County abuse settlement paid in five
            annual cycles, 2026 to 2030.
          </p>
        </div>
      </div>

      <form className="calc-form" autoComplete="off" onSubmit={keepLocal}>
        <CalcField
          helpId="points"
          label="Total Points (line 1 on the green-bar Point-Based Allocation Payment Notice)"
          value={pointsRaw}
          onChange={setPointsRaw}
          placeholder="59.5"
          open={openHelp === "points"}
          onToggle={() => setOpenHelp((current) => (current === "points" ? null : "points"))}
        />
        <CalcField
          helpId="fee"
          label="Attorney fee %"
          value={feeRaw}
          onChange={setFeeRaw}
          placeholder="40"
          open={openHelp === "fee"}
          onToggle={() => setOpenHelp((current) => (current === "fee" ? null : "fee"))}
        />
        <CalcField
          helpId="line6"
          label="Line 6: Net Point-Based Allocation Payment in Cycle 1"
          value={line6Raw}
          onChange={setLine6Raw}
          placeholder="Optional"
          open={openHelp === "line6"}
          onToggle={() => setOpenHelp((current) => (current === "line6" ? null : "line6"))}
        />
        <p className="hint">Nothing typed here is saved. Decimals are allowed.</p>
        {pointsRaw.trim() !== "" && !pointsReady && <p className="form-error">Enter total points as a number greater than zero.</p>}
        {feeRaw.trim() !== "" && !feeReady && <p className="form-error">Enter an attorney fee from 0 to 100.</p>}
        {line6Invalid && <p className="form-error">Line 6 must be a number, or left blank.</p>}
      </form>

      {estimate && (
        <div className="calc-results">
          <h2>Estimates</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Payment</th>
                <th scope="col">Formula</th>
                {estimate.crossCheck !== null && <th scope="col">Line 6 cross-check, valid for a 40% fee</th>}
              </tr>
            </thead>
            <tbody>
              {LATER_CYCLES.map((item) => (
                <tr key={item.cycle}>
                  <th scope="row">
                    Cycle {item.cycle} ({item.year})
                  </th>
                  <td>{usd.format(estimate.cyclePayment)}</td>
                  {estimate.crossCheck !== null && <td>{usd.format(line6CrossCheck(estimate.crossCheck))}</td>}
                </tr>
              ))}
              <tr>
                <th scope="row">Total of cycles 2 to 5</th>
                <td>{usd.format(estimate.cyclePayment * 4)}</td>
                {estimate.crossCheck !== null && <td>{usd.format(line6CrossCheck(estimate.crossCheck) * 4)}</td>}
              </tr>
              <tr>
                <th scope="row">Cycle 1 gross (2026)</th>
                <td>{usd.format(estimate.points * CYCLE1_PER_POINT)}</td>
                {estimate.crossCheck !== null && <td />}
              </tr>
              <tr>
                <th scope="row">Estimated 5-year total gross</th>
                <td>{usd.format(estimate.points * FIVE_YEAR_PER_POINT)}</td>
                {estimate.crossCheck !== null && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <ul className="calc-notes">
        <li>These are estimates. The county can adjust the point values.</li>
        <li>The 45% and 50% fee results are projections that have not been checked against a real file yet.</li>
        <li>The numbers assume the client&apos;s loans and liens are covered by the cycle 1 money.</li>
      </ul>
    </section>
  );
}

function CalcField({
  helpId,
  label,
  value,
  onChange,
  placeholder,
  open,
  onToggle,
}: {
  helpId: LaAbuseHelp["id"];
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
}) {
  const help = LA_ABUSE_HELP.find((item) => item.id === helpId);
  const panelId = `la-help-${helpId}`;
  return (
    <div className="calc-field">
      <div className="calc-field-head">
        <label htmlFor={panelId.replace("help", "input")}>{label}</label>
        <button
          type="button"
          className="calc-help-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          Where do I find this?
        </button>
      </div>
      {open && help && (
        <div className="calc-help" id={panelId} role="region">
          <p>{help.body}</p>
          {help.image ? (
            <figure>
              <img src={help.image} alt={help.imageAlt} />
              {help.caption ? <figcaption>{help.caption}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      )}
      <input
        id={panelId.replace("help", "input")}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
