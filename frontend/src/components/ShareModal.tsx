import { useState, useEffect } from "react";
import { X, Copy, Check, Lock, Clock, AlertCircle, Mail, MessageSquare, Share2 } from "lucide-react";
import { api } from "../api.js";
import { SharedDocument } from "../types.js";
import Input from "./Input.js";

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

export default function ShareModal({ documentId, documentTitle, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxAccessCount, setMaxAccessCount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  // Existing links for this document (for the list + revoke).
  const [existingShares, setExistingShares] = useState<SharedDocument[]>([]);

  useEffect(() => {
    loadExistingShares();
  }, [documentId]);

  const loadExistingShares = async () => {
    try {
      const response = await api.getUserShares();
      setExistingShares(response.data.shares.filter((s) => s.documentId === documentId));
    } catch (err) {
      console.error("Failed to load shares:", err);
    }
  };

  const createShareLink = async () => {
    if (password && password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (recipientEmail && !recipientEmail.includes("@")) {
      return setError("Enter a valid recipient email address");
    }

    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      const payload: {
        documentId: string;
        password?: string;
        expiresAt?: string;
        maxAccessCount?: number;
        recipientEmail?: string;
        message?: string;
      } = { documentId };
      if (password) payload.password = password;
      if (expiresAt) payload.expiresAt = expiresAt;
      if (maxAccessCount) payload.maxAccessCount = parseInt(maxAccessCount, 10);
      if (recipientEmail) payload.recipientEmail = recipientEmail.trim();
      if (message) payload.message = message.trim();

      const response = await api.createShare(payload);
      setShareUrl(response.data.shareUrl);
      setSuccess(
        recipientEmail
          ? `Share link created and emailed to ${recipientEmail.trim()}.`
          : "Share link created successfully!"
      );
      loadExistingShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const revokeShare = async (shareIdToRevoke: string) => {
    try {
      await api.revokeShare(shareIdToRevoke);
      setSuccess("Share link revoked");
      loadExistingShares();
      if (shareUrl) setShareUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke share");
    }
  };

  const resetForm = () => {
    setShareUrl("");
    setSuccess("");
    setError("");
  };

  return (
    <div className="modal-backdrop">
      <div className="modal modal-lg">
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-heading">
          <div className="modal-mark">
            <Share2 size={24} />
          </div>
          <div>
            <h2>Share Document</h2>
            <p>{documentTitle}</p>
          </div>
        </div>

        <div className="modal-content">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
              <Check size={16} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="form-fields">
            {!shareUrl ? (
              <>
                <p className="text-sm text-[var(--text-secondary)] -mt-1 mb-1">
                  Anyone with this link can view <strong>only this document</strong>. It's
                  view-only — the recipient can't download or edit it.
                </p>

                <Input
                  label="Password Protection (Optional)"
                  leftIcon={Lock}
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPasswordToggle
                />

                <Input
                  label="Expiration Date (Optional)"
                  leftIcon={Clock}
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />

                <Input
                  label="Max Access Count (Optional)"
                  type="number"
                  placeholder="Maximum number of views"
                  value={maxAccessCount}
                  onChange={(e) => setMaxAccessCount(e.target.value)}
                  min="1"
                />

                <Input
                  label="Email the Link to (Optional)"
                  leftIcon={Mail}
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />

                <Input
                  label="Message (Optional)"
                  leftIcon={MessageSquare}
                  type="text"
                  placeholder="A short note to include in the email"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />

                {password && (
                  <div className="flex items-start gap-2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
                    <Lock size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-xs leading-relaxed">
                      Share the password with the recipient <strong>separately</strong> — not in
                      the same email or channel as the link.
                    </span>
                  </div>
                )}

                <button
                  className="button bg-[var(--accent-blue)] text-white"
                  onClick={createShareLink}
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Share Link"}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-[var(--bg-secondary)]"
                    />
                    <button className="button px-4" onClick={copyToClipboard} disabled={copied}>
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                    View-only: the recipient can open this one document but can't download or edit
                    it.
                    {password && " Remember to send them the password separately."}
                  </p>
                </div>

                <button
                  className="button bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  onClick={resetForm}
                >
                  Create New Link
                </button>
              </div>
            )}

            {/* Existing Shares */}
            {existingShares.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">
                  Existing Share Links
                </h3>
                <div className="space-y-2">
                  {existingShares.map((share) => (
                    <div
                      key={share._id}
                      className="p-3 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-between border border-[var(--border-color)]"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="text-sm text-[var(--text-primary)] truncate font-mono">
                          {share.shareUrl}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap gap-x-2">
                          {share.expiresAt && (
                            <span>Expires: {new Date(share.expiresAt).toLocaleDateString()}</span>
                          )}
                          {share.maxAccessCount && <span>Max views: {share.maxAccessCount}</span>}
                          <span>Viewed: {share.currentAccessCount}</span>
                        </div>
                      </div>
                      <button
                        className="icon-button text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => revokeShare(share._id)}
                        title="Revoke share"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
