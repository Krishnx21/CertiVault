/**
 * Document Preview Modal
 * Shows document details and preview
 */

import { useState, useEffect } from "react";
import { X, FileText, ShieldCheck, Download, Star, Eye } from "lucide-react";
import { Document } from "../types.js";
import { api } from "../api.js";

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  /** When false, the Download button is hidden (e.g. vault viewers). Default true. */
  canDownload?: boolean;
  /** When false, the favorite button is hidden (e.g. someone else's vault). Default true. */
  canFavorite?: boolean;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function DocumentPreviewModal({
  document,
  onClose,
  onToggleFavorite,
  canDownload = true,
  canFavorite = true,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inline, view-only preview of the actual file (works even for viewers who
  // cannot download). The blob object URL is revoked on unmount / doc change.
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMime, setPreviewMime] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let revoked = false;
    let objectUrl = "";
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewUrl("");

    api
      .viewDocument(document._id)
      .then(({ url, mimeType }) => {
        if (revoked) {
          window.URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);
        setPreviewMime(mimeType);
      })
      .catch((err: any) => {
        if (!revoked) setPreviewError(err.message || "Preview unavailable");
      })
      .finally(() => {
        if (!revoked) setPreviewLoading(false);
      });

    return () => {
      revoked = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [document._id]);

  const ext = (document.metadata?.extension || "").toLowerCase();
  const isImage =
    previewMime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
  const isPdf = previewMime.includes("pdf") || ext === "pdf";

  const handleDownload = async () => {
    setLoading(true);
    setError("");
    try {
      await api.downloadDocument(document._id, document.fileName);
    } catch (err: any) {
      setError(err.message || "Failed to download document");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    // Optimistic update
    const originalIsFavorite = document.isFavorite;
    if (onToggleFavorite) {
      onToggleFavorite(document._id, !originalIsFavorite);
    }

    try {
      if (document.isFavorite) {
        await api.unfavoriteDocument(document._id);
      } else {
        await api.favoriteDocument(document._id);
      }
    } catch (err: any) {
      // Revert on error
      if (onToggleFavorite) {
        onToggleFavorite(document._id, originalIsFavorite);
      }
      setError(err.message || "Failed to update favorite");
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-lg" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={19} />
        </button>
        <div className="modal-heading">
          <div className="modal-mark">
            <FileText />
          </div>
          <div>
            <h2>{document.title}</h2>
            <p>{canDownload ? "Document details and preview" : "View-only preview"}</p>
          </div>
        </div>

        <div className="document-preview-content">
          {/* Inline file preview */}
          <div className="doc-preview-frame">
            {previewLoading && (
              <div className="doc-preview-state">
                <span className="spinner" />
                <span>Loading preview…</span>
              </div>
            )}
            {!previewLoading && previewError && (
              <div className="doc-preview-state">
                <FileText size={30} />
                <span>{previewError}</span>
              </div>
            )}
            {!previewLoading && !previewError && previewUrl && isImage && (
              <img src={previewUrl} alt={document.title} className="doc-preview-media" />
            )}
            {!previewLoading && !previewError && previewUrl && isPdf && (
              <iframe title={document.title} src={previewUrl} className="doc-preview-iframe" />
            )}
            {!previewLoading && !previewError && previewUrl && !isImage && !isPdf && (
              <div className="doc-preview-state">
                <Eye size={30} />
                <span>Inline preview isn&apos;t available for this file type.</span>
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className="document-info-grid">
            <div className="info-item">
              <label>Status</label>
              <span className={`status ${document.status}`}>
                <i />
                {document.status}
              </span>
            </div>
            <div className="info-item">
              <label>Category</label>
              <span className="type-chip">{document.category}</span>
            </div>
            <div className="info-item">
              <label>Owner</label>
              <div className="owner">
                <div className="avatar tiny">
                  {document.ownerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                {document.ownerName}
              </div>
            </div>
            <div className="info-item">
              <label>File Size</label>
              <span>{formatBytes(document.fileSize)}</span>
            </div>
            <div className="info-item">
              <label>File Type</label>
              <span>{document.metadata.extension.toUpperCase()}</span>
            </div>
            <div className="info-item">
              <label>Created</label>
              <span>{formatDate(document.createdAt)}</span>
            </div>
            <div className="info-item">
              <label>Checksum</label>
              <span className="checksum">{document.checksum.slice(0, 16)}...</span>
            </div>
            <div className="info-item">
              <label>Encrypted</label>
              <span>{document.isEncrypted ? "Yes" : "No"}</span>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="document-description">
              <label>Description</label>
              <p>{document.description}</p>
            </div>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="document-tags">
              <label>Tags</label>
              <div className="tags-list">
                {document.tags.map((tag, index) => (
                  <span key={index} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="document-metadata">
            <label>File Information</label>
            <div className="metadata-grid">
              <div>
                <span>Original Name</span>
                <p>{document.metadata.originalName}</p>
              </div>
              <div>
                <span>Extension</span>
                <p>{document.metadata.extension}</p>
              </div>
              {document.metadata.dimensions && (
                <div>
                  <span>Dimensions</span>
                  <p>{document.metadata.dimensions.width} × {document.metadata.dimensions.height}</p>
                </div>
              )}
              {document.metadata.pageCount && (
                <div>
                  <span>Pages</span>
                  <p>{document.metadata.pageCount}</p>
                </div>
              )}
              {canDownload && (
                <div>
                  <span>Download Count</span>
                  <p>{document.downloadCount}</p>
                </div>
              )}
              {document.lastAccessedAt && (
                <div>
                  <span>Last Accessed</span>
                  <p>{formatDate(document.lastAccessedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Verification Info */}
          {document.verifiedAt && (
            <div className="document-verification">
              <label>Verification</label>
              <div className="verification-info">
                <ShieldCheck size={16} />
                <span>Verified on {formatDate(document.verifiedAt)}</span>
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-actions">
          {!canDownload && (
            <span className="view-only-note">
              <Eye size={15} aria-hidden="true" />
              View-only access — downloading is disabled
            </span>
          )}
          {canFavorite && (
            <button className="button ghost" onClick={handleToggleFavorite}>
              <Star size={16} fill={document.isFavorite ? "currentColor" : "none"} />
              {document.isFavorite ? "Remove from favorites" : "Add to favorites"}
            </button>
          )}
          {canDownload && (
            <button className="button ghost" onClick={handleDownload} disabled={loading}>
              <Download size={16} />
              {loading ? "Loading..." : "Download"}
            </button>
          )}
          <button className="button primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
