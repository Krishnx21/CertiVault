import { DocumentModel, IDocument } from "./document.model.js";

const now = Date.now();

const initialDocuments: IDocument[] = [
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

export const seedDatabase = async (): Promise<void> => {
  try {
    const count = await DocumentModel.countDocuments();
    if (count === 0) {
      console.log("Seeding initial documents into MongoDB...");
      await DocumentModel.insertMany(initialDocuments);
      console.log("Documents seeded successfully!");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
};

export const documentStore = {
  all: async (): Promise<IDocument[]> => {
    return await DocumentModel.find().lean() as unknown as IDocument[];
  },
  add: async (document: IDocument): Promise<IDocument> => {
    const created = await DocumentModel.create(document);
    return created.toObject() as unknown as IDocument;
  },
  find: async (id: string): Promise<IDocument | null> => {
    return await DocumentModel.findOne({ id }).lean() as unknown as IDocument | null;
  },
  update: async (id: string, updates: Partial<IDocument>): Promise<IDocument | null> => {
    return await DocumentModel.findOneAndUpdate({ id }, updates, { new: true }).lean() as unknown as IDocument | null;
  },
  remove: async (id: string): Promise<boolean> => {
    const result = await DocumentModel.deleteOne({ id });
    return (result.deletedCount ?? 0) > 0;
  },
};
