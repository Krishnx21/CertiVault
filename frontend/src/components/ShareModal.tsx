import { useState, useEffect } from "react";
import { X, Copy, Link, Users, Clock, Lock, Check, AlertCircle } from "lucide-react";
import { api } from "../api.js";
import { SharedDocument, SharedMember, Permission } from "../types.js";

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

type Tab = "link" | "members";

export default function ShareModal({ documentId, documentTitle, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("link");
  const [shareUrl, setShareUrl] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxAccessCount, setMaxAccessCount] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  // Member invitation state
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [permission, setPermission] = useState<Permission>("viewer");
  const [isInviting, setIsInviting] = useState(false);

  // Members list
  const [members, setMembers] = useState<SharedMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Existing shares
  const [existingShares, setExistingShares] = useState<SharedDocument[]>([]);

  useEffect(() => {
    loadMembers();
    loadExistingShares();
  }, [documentId]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await api.getDocumentMembers(documentId);
      setMembers(response.data);
    } catch (err: any) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadExistingShares = async () => {
    try {
      const response = await api.getUserShares();
      setExistingShares(response.data.shares.filter((s) => s.documentId === documentId));
    } catch (err: any) {
      console.error("Failed to load shares:", err);
    }
  };

  const createShareLink = async () => {
    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      const data: any = { documentId };
      if (password) data.password = password;
      if (expiresAt) data.expiresAt = expiresAt;
      if (maxAccessCount) data.maxAccessCount = parseInt(maxAccessCount);

      const response = await api.createShare(data);
      setShareUrl(response.data.shareUrl);
      setSuccess("Share link created successfully!");
      loadExistingShares();
    } catch (err: any) {
      setError(err.message || "Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  const inviteMember = async () => {
    if (!memberEmail) return setError("Email is required");
    if (!memberEmail.includes("@")) return setError("Invalid email address");

    setIsInviting(true);
    setError("");
    setSuccess("");

    try {
      const data: any = {
        documentId,
        memberEmail,
        permission,
      };
      if (memberName) data.memberName = memberName;

      await api.inviteMember(data);
      setSuccess("Invitation sent successfully!");
      setMemberEmail("");
      setMemberName("");
      setPermission("viewer");
      loadMembers();
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const revokeMember = async (memberId: string) => {
    try {
      await api.revokeMember(memberId);
      setSuccess("Member access revoked");
      loadMembers();
    } catch (err: any) {
      setError(err.message || "Failed to revoke member");
    }
  };

  const updatePermission = async (memberId: string, newPermission: Permission) => {
    try {
      await api.updateMemberPermission(memberId, newPermission);
      setSuccess("Permission updated");
      loadMembers();
    } catch (err: any) {
      setError(err.message || "Failed to update permission");
    }
  };

  const revokeShare = async (shareIdToRevoke: string) => {
    try {
      await api.revokeShare(shareIdToRevoke);
      setSuccess("Share link revoked");
      loadExistingShares();
      if (shareUrl) {
        setShareUrl("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke share");
    }
  };

  const getPermissionBadge = (perm: Permission) => {
    const colors = {
      viewer: "bg-blue-100 text-blue-700",
      editor: "bg-green-100 text-green-700",
      admin: "bg-purple-100 text-purple-700",
    };
    return colors[perm];
  };

  return (
    <div className="modal-backdrop">
      <div className="modal modal-lg">
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-heading">
          <div className="modal-mark">
            <Users size={24} />
          </div>
          <div>
            <h2>Share Document</h2>
            <p>{documentTitle}</p>
          </div>
        </div>

        <div className="modal-content">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-[var(--border-color)] mb-6">
            <button
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "link"
                  ? "text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              onClick={() => setActiveTab("link")}
            >
              <div className="flex items-center gap-2">
                <Link size={18} />
                Share Link
              </div>
            </button>
            <button
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === "members"
                  ? "text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              onClick={() => setActiveTab("members")}
            >
              <div className="flex items-center gap-2">
                <Users size={18} />
                Members ({members.length})
              </div>
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="upload-error flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <Check size={18} />
              {success}
            </div>
          )}

          {/* Share Link Tab */}
          {activeTab === "link" && (
            <div className="form-fields">
              {!shareUrl ? (
                <>
                  <div className="field-label">
                    <span>Password Protection (Optional)</span>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input
                        type="password"
                        placeholder="Enter password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="field-label">
                    <span>Expiration Date (Optional)</span>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="field-label">
                    <span>Max Access Count (Optional)</span>
                    <input
                      type="number"
                      placeholder="Maximum number of accesses"
                      value={maxAccessCount}
                      onChange={(e) => setMaxAccessCount(e.target.value)}
                      min="1"
                    />
                  </div>

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
                      <button
                        className="button px-4"
                        onClick={copyToClipboard}
                        disabled={copied}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    className="button bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                    onClick={() => {
                      setShareUrl("");
                    }}
                  >
                    Create New Link
                  </button>
                </div>
              )}

              {/* Existing Shares */}
              {existingShares.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-[var(--text-primary)] mb-3">Existing Share Links</h3>
                  <div className="space-y-2">
                    {existingShares.map((share) => (
                      <div
                        key={share._id}
                        className="p-3 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[var(--text-primary)] truncate">
                            {share.shareUrl}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            {share.expiresAt && `Expires: ${new Date(share.expiresAt).toLocaleDateString()}`}
                            {share.maxAccessCount && ` • Max access: ${share.maxAccessCount}`}
                            {` • Accessed: ${share.currentAccessCount}`}
                          </div>
                        </div>
                        <button
                          className="icon-button ml-2 text-red-500 hover:text-red-700"
                          onClick={() => revokeShare(share._id)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="form-fields">
              <div className="field-label">
                <span>Invite by Email</span>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>

              <div className="field-label">
                <span>Member Name (Optional)</span>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
              </div>

              <div className="field-label">
                <span>Permission</span>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as Permission)}
                >
                  <option value="viewer">Viewer - Can only view</option>
                  <option value="editor">Editor - Can view and edit</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>

              <button
                className="button bg-[var(--accent-blue)] text-white"
                onClick={inviteMember}
                disabled={isInviting}
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </button>

              {/* Members List */}
              <div className="mt-6">
                <h3 className="font-medium text-[var(--text-primary)] mb-3">Members</h3>
                {isLoadingMembers ? (
                  <div className="text-center text-[var(--text-muted)] py-4">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="text-center text-[var(--text-muted)] py-4">No members yet</div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member._id}
                        className="p-3 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {member.memberName || member.memberEmail}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            {member.memberEmail}
                          </div>
                          <div className="mt-2">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPermissionBadge(
                                member.permission
                              )}`}
                            >
                              {member.permission}
                            </span>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${
                                member.inviteStatus === "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : member.inviteStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {member.inviteStatus}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <select
                            value={member.permission}
                            onChange={(e) => updatePermission(member._id, e.target.value as Permission)}
                            className="text-sm py-1 px-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            className="icon-button text-red-500 hover:text-red-700"
                            onClick={() => revokeMember(member._id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
