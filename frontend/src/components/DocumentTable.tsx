import { Files, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Document } from "../types.js";

interface DocumentTableProps {
  documents: Document[];
  search: string;
  setSearch: (search: string) => void;
  status: string;
  setStatus: (status: string) => void;
  loading: boolean;
  onVerify: (id: string) => void;
  onDelete: (id: string) => void;
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

export function DocumentTable({
  documents,
  search,
  setSearch,
  status,
  setStatus,
  loading,
  onVerify,
  onDelete,
}: DocumentTableProps) {
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
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div className="document-cell">
                    <div className="file-icon">
                      {(doc.name.split(".").pop() || "").toUpperCase().slice(0, 3)}
                    </div>
                    <div>
                      <strong>{doc.name}</strong>
                      <span>
                        {formatBytes(doc.size)} · ID {doc.checksum.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="type-chip">{doc.type}</span>
                </td>
                <td>
                  <span className={`status ${doc.status}`}>
                    <i />
                    {doc.status}
                  </span>
                </td>
                <td>
                  <div className="owner">
                    <div className="avatar tiny">KK</div>
                    {doc.owner}
                  </div>
                </td>
                <td>{relativeDate(doc.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    {doc.status === "pending" && (
                      <button onClick={() => onVerify(doc.id)} title="Verify">
                        <ShieldCheck size={17} />
                      </button>
                    )}
                    <button onClick={() => onDelete(doc.id)} title="Delete">
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
      </div>
    </section>
  );
}
