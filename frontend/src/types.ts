export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "verified" | "pending";
  owner: string;
  createdAt: string;
  checksum: string;
  verifiedAt?: string;
}

export interface Summary {
  total: number;
  verified: number;
  pending: number;
  storageBytes: number;
}
