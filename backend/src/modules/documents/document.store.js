const now = Date.now();

const documents = [
  {
    id: "demo-credential",
    name: "Cloud Security Certificate.pdf",
    type: "Certificate",
    size: 2457600,
    status: "verified",
    owner: "Krishna Kumar",
    createdAt: new Date(now - 2 * 86400000).toISOString(),
    checksum: "7b9f4c2e8a10d34f",
  },
  {
    id: "demo-contract",
    name: "Vendor Agreement 2026.pdf",
    type: "Contract",
    size: 1153433,
    status: "pending",
    owner: "Krishna Kumar",
    createdAt: new Date(now - 5 * 86400000).toISOString(),
    checksum: "a41d9b6604cc82e1",
  },
  {
    id: "demo-identity",
    name: "Identity Verification.png",
    type: "Identity",
    size: 845414,
    status: "verified",
    owner: "Krishna Kumar",
    createdAt: new Date(now - 8 * 86400000).toISOString(),
    checksum: "18e613fea60aeb4d",
  },
];

export const documentStore = {
  all: () => [...documents],
  add: (document) => {
    documents.unshift(document);
    return document;
  },
  find: (id) => documents.find((document) => document.id === id),
  remove: (id) => {
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return false;
    documents.splice(index, 1);
    return true;
  },
};
