"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

const KPI_CARDS = [
  { label: "Controls Implemented", value: "—", sub: "of total selected" },
  { label: "Open Findings", value: "—", sub: "from latest assessment" },
  { label: "Risk Score", value: "—", sub: "aggregate residual risk" },
  { label: "Compliance Coverage", value: "—", sub: "across active frameworks" },
  { label: "Training Completion", value: "—", sub: "of required staff" },
  { label: "Evidence Items", value: "—", sub: "collected to date" },
];

const CRF_STEPS = [
  { step: 1, name: "Initiate", description: "Establish the governance program and identify stakeholders.", color: "bg-blue-50 border-blue-200" },
  { step: 2, name: "Inventory", description: "Catalog assets, systems, data flows, and third-party vendors.", color: "bg-indigo-50 border-indigo-200" },
  { step: 3, name: "Select", description: "Choose applicable controls from NIST, ISO 27001, SOC 2, etc.", color: "bg-violet-50 border-violet-200" },
  { step: 4, name: "Educate", description: "Train teams on selected controls, policies, and procedures.", color: "bg-purple-50 border-purple-200" },
  { step: 5, name: "Implement", description: "Deploy controls and document evidence of implementation.", color: "bg-pink-50 border-pink-200" },
  { step: 6, name: "Validate", description: "Assess control effectiveness through audits and assessments.", color: "bg-rose-50 border-rose-200" },
  { step: 7, name: "Communicate", description: "Report posture to board, regulators, and clients.", color: "bg-orange-50 border-orange-200" },
];

export default function OrgDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Security Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Key security indicators for your GRC program</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CARDS.map(({ label, value, sub }) => (
          <div key={label} className="rounded-lg border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4">CRF Governance & Risk Model</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CRF_STEPS.map(({ step, name, description, color }) => (
            <Link
              key={step}
              href={`/${orgSlug}/${name.toLowerCase()}`}
              className={`rounded-lg border p-5 transition-shadow hover:shadow-md ${color}`}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {step}</p>
              <h3 className="mt-1.5 text-base font-semibold">{name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
