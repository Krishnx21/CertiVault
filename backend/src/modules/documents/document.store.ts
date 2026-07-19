import { DocumentModel, IDocument } from "./document.model.js";

export const seedDatabase = async (): Promise<void> => {
  // Seed data intentionally removed: demo documents require valid User ObjectIds
  // which aren't available at startup. The DB starts empty and is populated by
  // real uploads.
};

export const documentStore = {
  all: async (): Promise<IDocument[]> => {
    return (await DocumentModel.find().lean()) as unknown as IDocument[];
  },
  add: async (document: any): Promise<IDocument> => {
    const created = await DocumentModel.create(document);
    return created.toObject() as unknown as IDocument;
  },
  find: async (id: string): Promise<IDocument | null> => {
    return (await DocumentModel.findOne({ id }).lean()) as unknown as IDocument | null;
  },
  update: async (id: string, updates: Partial<IDocument>): Promise<IDocument | null> => {
    return (await DocumentModel.findOneAndUpdate({ id }, updates, {
      returnDocument: "after",
    }).lean()) as unknown as IDocument | null;
  },
  remove: async (id: string): Promise<boolean> => {
    const result = await DocumentModel.deleteOne({ id });
    return (result.deletedCount ?? 0) > 0;
  },
};
