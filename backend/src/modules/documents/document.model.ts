/**
 * Document model - MongoDB schema for document metadata
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  owner: mongoose.Types.ObjectId;
  ownerName: string;
  ownerEmail: string;
  tags: string[];
  status: "pending" | "verified" | "rejected";
  verificationStatus: "not_verified" | "verified" | "failed";
  storageUrl: string;
  storageKey: string;
  storageProvider?: "s3" | "local";
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  hash: string;
  isEncrypted: boolean;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  isFavorite: boolean;
  favoritedAt?: Date;
  downloadCount: number;
  lastAccessedAt?: Date;
  metadata: {
    originalName: string;
    extension: string;
    dimensions?: { width: number; height: number };
    pageCount?: number;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [255, "Title cannot exceed 255 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["certificate", "contract", "identity", "invoice", "report", "other"],
      default: "other",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
    },
    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ["not_verified", "verified", "failed"],
      default: "not_verified",
    },
    storageUrl: {
      type: String,
      required: [true, "Storage URL is required"],
    },
    storageKey: {
      type: String,
      required: [true, "Storage key is required"],
      unique: true,
      sparse: true, // Allow null values in unique index
    },
    storageProvider: {
      type: String,
      enum: ["s3", "local"],
      default: "local",
    },
    thumbnailUrl: {
      type: String,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    checksum: {
      type: String,
      required: [true, "Checksum is required"],
      index: true,
    },
    hash: {
      type: String,
      required: [true, "Hash is required"],
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    favoritedAt: {
      type: Date,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
    },
    metadata: {
      originalName: {
        type: String,
        required: [true, "Original name is required"],
      },
      extension: {
        type: String,
        required: [true, "Extension is required"],
      },
      dimensions: {
        width: Number,
        height: Number,
      },
      pageCount: Number,
      author: String,
      subject: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
documentSchema.index({ owner: 1, isArchived: 1 });
documentSchema.index({ owner: 1, isFavorite: 1 });
documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ title: "text", description: "text", tags: "text", ownerName: "text", fileName: "text" });

// Compound index for search
documentSchema.index({ owner: 1, isArchived: 1, status: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema);

// Clean up problematic indexes on model initialization
DocumentModel.on('index', async (error) => {
  if (error) {
    console.error('Document model index error:', error);
    // Clean up problematic indexes
    const problematicIndexes = ['id_1', 'storageKey_1', 'title_text_description_text_tags_text'];
    for (const indexName of problematicIndexes) {
      if (error.message.includes(indexName)) {
        console.log(`Attempting to clean up ${indexName} index...`);
        try {
          await DocumentModel.collection.dropIndex(indexName);
          console.log(`Successfully dropped ${indexName} index`);
          await DocumentModel.syncIndexes();
          console.log('Successfully synced indexes after cleanup');
        } catch (dropError) {
          console.log(`Could not drop ${indexName} index (may not exist):`, (dropError as any).message);
        }
      }
    }

    // Dynamic cleanup for IndexOptionsConflict / text index conflicts
    if (error.message.includes('IndexOptionsConflict') || error.message.includes('equivalent index already exists')) {
      const match = error.message.match(/existing index: \{[^}]*name:\s*["']([^"']+)["']/);
      if (match && match[1]) {
        const existingIndexName = match[1];
        console.log(`Attempting to dynamically clean up conflicting index: ${existingIndexName}...`);
        try {
          await DocumentModel.collection.dropIndex(existingIndexName);
          console.log(`Successfully dropped conflicting index: ${existingIndexName}`);
          await DocumentModel.syncIndexes();
          console.log('Successfully synced indexes after dynamic cleanup');
        } catch (dropError) {
          console.log(`Could not drop conflicting index ${existingIndexName}:`, (dropError as any).message);
        }
      }
    }
  }
});

// Also attempt to drop problematic indexes on model init (before any operations)
DocumentModel.init().then(async () => {
  const indexes = await DocumentModel.collection.listIndexes().toArray();
  const problematicIndexes = ['id_1', 'storageKey_1', 'title_text_description_text_tags_text'];
  let dropped = false;
  for (const index of indexes) {
    if (problematicIndexes.includes(index.name)) {
      console.log(`Found problematic index ${index.name}, attempting to drop...`);
      try {
        await DocumentModel.collection.dropIndex(index.name);
        console.log(`Successfully dropped ${index.name} index`);
        dropped = true;
      } catch (dropError) {
        console.log(`Could not drop ${index.name}:`, (dropError as any).message);
      }
    }
  }
  if (dropped) {
    console.log('Syncing indexes after dropping problematic ones...');
    await DocumentModel.syncIndexes();
  }
}).catch(async (err) => {
  console.error('Error initializing DocumentModel:', err);
  if (err.message.includes('IndexOptionsConflict') || err.message.includes('equivalent index already exists')) {
    const match = err.message.match(/existing index: \{[^}]*name:\s*["']([^"']+)["']/);
    if (match && match[1]) {
      const existingIndexName = match[1];
      console.log(`Attempting to dynamically clean up conflicting index in init catch: ${existingIndexName}...`);
      try {
        await DocumentModel.collection.dropIndex(existingIndexName);
        console.log(`Successfully dropped conflicting index: ${existingIndexName}`);
        await DocumentModel.syncIndexes();
        console.log('Successfully synced indexes after init catch cleanup');
      } catch (dropError) {
        console.log(`Could not drop conflicting index ${existingIndexName} in catch:`, (dropError as any).message);
      }
    }
  }
});