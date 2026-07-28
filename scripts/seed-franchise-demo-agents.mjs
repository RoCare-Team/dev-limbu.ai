// scripts/seed-franchise-demo-agents.mjs
// Franchise demo ke real agents DB me daalo (phone se upsert — dobara chalao to duplicate nahi).
// Chalao:  node scripts/seed-franchise-demo-agents.mjs

import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "../src/lib/mongoConnectionUri.js";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

function normPhone(p) {
  let n = String(p || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;
  return n;
}

const AGENTS = [
  { agentName: "Nagendra Singh", agentPhone: "7065178665" },
  { agentName: "Luv Sir", agentPhone: "9355105058" },
  { agentName: "Atul", agentPhone: "9319595497" },
  { agentName: "Pradeep", agentPhone: "9311587718" },
];

const schema = new mongoose.Schema(
  {
    agentName: { type: String, required: true },
    agentPhone: { type: String, required: true },
    agentEmail: { type: String, default: "" },
    meetLink: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");

  const uri = mongooseConnectionUri(process.env.MONGODB_URI);
  await mongoose.connect(uri);
  console.log("[seed] connected:", mongoose.connection.db?.databaseName);

  const FranchiseDemoAgent =
    mongoose.models.FranchiseDemoAgent ||
    mongoose.model("FranchiseDemoAgent", schema);

  for (const a of AGENTS) {
    const phone = normPhone(a.agentPhone);
    const res = await FranchiseDemoAgent.updateOne(
      { agentPhone: phone },
      {
        $set: { agentName: a.agentName, isActive: true },
        $setOnInsert: { agentPhone: phone, agentEmail: "", meetLink: "" },
      },
      { upsert: true }
    );
    const action = res.upsertedCount ? "INSERTED" : "updated";
    console.log(`  ${action}: ${a.agentName} (${phone})`);
  }

  const all = await FranchiseDemoAgent.find({ isActive: true })
    .select("agentName agentPhone _id")
    .lean();
  console.log(`\n[seed] active agents (${all.length}):`);
  all.forEach((x) => console.log(`  ${x._id}  ${x.agentName}  ${x.agentPhone}`));

  await mongoose.disconnect();
  console.log("\n[seed] done ✅");
}

main().catch((e) => {
  console.error("[seed] failed:", e.message);
  process.exit(1);
});
