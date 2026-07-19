import { useState } from "react";
import { Files, Search, ShieldCheck, Trash2, Star, Archive, RefreshCw, Eye } from "lucide-react";
import { Document } from "../types.js";
import { DocumentPreviewModal } from "./DocumentPreviewModal.js";

interface DocumentTableProps {
  documents: Document[];
  search: string;
  setSearch: (search: string) => void;
  status: string;
  setStatus: (status: string) => void;
  loading: boolean;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  onViewVerification: (id: string) => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

const relativeDate = (date: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
};

const getCategoryIcon = (category: string) => {
  const ext = category.slice(0, 3).toUpperCase();
  return ext;
};

export function DocumentTable({
  documents,
  search,
  setSearch,
  status,
  setStatus,
  loading,
  onVerify,
  onDelete,
  onToggleFavorite,
  onArchive,
  onRestore,
  page,
  totalPages,
  onPageChange,
  sortBy,
  setSortBy,
  onViewVerification,
}: DocumentTableProps) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  return (
    <section className="documents-panel">
      <div className="panel-head">
        <div>
          <h2>Recent documents</h2>
          <p>Manage and verify files in your workspace.</p>
        </div>
        <div className="panel-tools">
          <div className="table-search">
            <Search size={16} />
            <input
              aria-label="Search documents"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search…"
            />
          </div>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            aria-label="Sort by"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="size_asc">Size (smallest)</option>
            <option value="size_desc">Size (largest)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Category</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc._id}>
                <td>
                  <div className="document-cell">
                    <div className="file-icon">
                      {getCategoryIcon(doc.category)}
                    </div>
                    <div>
                      <strong>{doc.title}</strong>
                      <span>
                        {formatBytes(doc.fileSize)} · {doc.metadata.extension.toUpperCase()} · {doc.checksum.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="type-chip">{doc.category}</span>
                </td>
                <td>
                  <span className={`status ${doc.status}`}>
                    <i />
                    {doc.status}
                  </span>
                </td>
                <td>
                  <div className="owner">
                    <div className="avatar tiny">
                      {doc.ownerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    {doc.ownerName}
                  </div>
                </td>
                <td>{relativeDate(doc.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      onClick={() => setPreviewDocument(doc)}
                      title="View details"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      onClick={() => onViewVerification(doc._id)}
                      title="View verification"
                    >
                      <ShieldCheck size={17} />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(doc._id, doc.isFavorite)}
                      title={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      className={doc.isFavorite ? "active" : ""}
                    >
                      <Star size={17} fill={doc.isFavorite ? "currentColor" : "none"} />
                    </button>
                    {doc.status === "pending" && (
                      <button onClick={() => onVerify(doc._id)} title="Verify">
                        <ShieldCheck size={17} />
                      </button>
                    )}
                    {!doc.isArchived && (
                      <button onClick={() => onArchive(doc._id)} title="Archive">
                        <Archive size={17} />
                      </button>
                    )}
                    {doc.isArchived && (
                      <button onClick={() => onRestore(doc._id)} title="Restore">
                        <RefreshCw size={17} />
                      </button>
                    )}
                    <button onClick={() => onDelete(doc._id)} title="Delete">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="empty-state">Loading secure workspace…</div>}
        {!loading && !documents.length && (
          <div className="empty-state">
            <Files size={32} />
            <strong>No documents found</strong>
            <span>Try another search or upload a new document.</span>
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="button ghost"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="button ghost"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </section>
  );
}
