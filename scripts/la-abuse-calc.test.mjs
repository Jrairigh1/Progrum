import assert from "node:assert/strict";
import { laterCyclePayment } from "../src/config/laAbusePayments.ts";

const cases = [
  { points: 59.5, amount: 39887 },
  { points: 68.5, amount: 45930 },
  { points: 75, amount: 50295 },
];

for (const sample of cases) {
  const payment = laterCyclePayment(sample.points, 40);
  const gap = Math.abs(payment - sample.amount);
  assert.ok(gap <= 10, `${sample.points} points at 40% is ${payment}, expected within $10 of ${sample.amount}`);
}

console.log("la abuse calculator checks passed");
