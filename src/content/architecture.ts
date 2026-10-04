// H.6b. The paragraph restates Section 10. Node names match the prototype diagram.

export const architecture = {
  heading: "Proposed architecture",
  text: "One central server owns codes, records, grants, and the audit log; every app is an API client. Revocation, single use, expiry, and rate limits are enforced on the server.",
  label: "Proposal, not built.",
  columns: [
    {
      name: "API clients",
      nodes: [
        { title: "Phone app", detail: "on-device recognition" },
        { title: "Web app" },
        { title: "Partner systems" },
      ],
    },
    {
      name: "Edge layer",
      nodes: [
        {
          title: "Fast reads",
          detail: "resolve, cached signed records",
          accent: true,
        },
      ],
    },
    {
      name: "Central server",
      nodes: [
        {
          title: "Write and signing API",
          detail: "issue, revoke, version, grants",
        },
        {
          title: "Portable SQL",
          detail: "codes, records, record_versions, grants, audit_events",
        },
        { title: "Object storage", detail: "retry photos" },
        { title: "Cloud vision model", detail: "hard cases only" },
      ],
    },
  ],
};
