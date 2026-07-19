/**
 * Verification Page
 * Document verification details and timeline
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, QrCode, X } from "lucide-react";
import { api } from "../api.js";
import { Verification } from "../types.js";

export function VerificationPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadVerification();
  }, [documentId]);

  const loadVerification = async () => {
    if (!documentId) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await api.getVerification(documentId);
      setVerification(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!documentId) return;
    
    try {
      await api.verifyDocument(documentId, status, "manual");
      setToast(`Document ${status} successfully`);
      loadVerification();
    } catch (err: any) {
      setError(err.message || "Verification failed");
    }
  };

  const handleReverify = async () => {
    if (!documentId) return;
    
    try {
      await api.reverifyDocument(documentId, "manual");
      setToast("Document re-verified successfully");
      loadVerification();
    } catch (err: any) {
      setError(err.message || "Re-verification failed");
    }
  };

  const handleGenerateQR = async () => {
    if (!documentId) return;
    
    try {
      await api.generateVerificationQR(documentId);
      setShowQR(true);
      loadVerification();
    } catch (err: any) {
      setError(err.message || "QR generation failed");
    }
  };

  const handleDownloadQR = async () => {
    if (!documentId) return;
    
    try {
      const blob = await api.downloadVerificationQR(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verification-qr-${documentId}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "QR download failed");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="text-green-500" size={24} />;
      case "rejected":
        return <XCircle className="text-red-500" size={24} />;
      case "pending":
        return <Clock className="text-yellow-500" size={24} />;
      case "expired":
        return <AlertTriangle className="text-orange-500" size={24} />;
      case "tampered":
        return <AlertTriangle className="text-red-600" size={24} />;
      case "revoked":
        return <XCircle className="text-gray-500" size={24} />;
      default:
        return <ShieldCheck size={24} />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">Loading verification details...</div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="page">
        <div className="error-state">{error || "Verification not found"}</div>
      </div>
    );
  }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      
      <div className="page-header">
        <div>
          <h1>Document Verification</h1>
          <p>View and manage document verification status</p>
        </div>
        <div className="page-actions">
          <button className="button ghost" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="verification-overview">
        <div className="verification-status-card">
          <div className="status-icon">
            {getStatusIcon(verification.verificationStatus)}
          </div>
          <div className="status-info">
            <h2>{verification.verificationStatus.toUpperCase()}</h2>
            <p>
              {verification.verificationMethod} verification • {verification.verificationAttempts} attempt(s)
            </p>
          </div>
        </div>

        <div className="verification-actions">
          {verification.verificationStatus === "pending" && (
            <>
              <button className="button primary" onClick={() => handleVerify("verified")}>
                <CheckCircle size={16} />
                Verify
              </button>
              <button className="button ghost" onClick={() => handleVerify("rejected")}>
                <XCircle size={16} />
                Reject
              </button>
            </>
          )}
          {verification.verificationStatus === "verified" && (
            <button className="button ghost" onClick={handleReverify}>
              <RefreshCw size={16} />
              Re-verify
            </button>
          )}
          <button className="button ghost" onClick={handleGenerateQR}>
            <QrCode size={16} />
            Generate QR
          </button>
          {verification.qrCodeUrl && (
            <button className="button ghost" onClick={handleDownloadQR}>
              <Download size={16} />
              Download QR
            </button>
          )}
        </div>
      </div>

      <div className="verification-details-grid">
        <div className="detail-card">
          <h3>Document Information</h3>
          <div className="detail-row">
            <label>Title</label>
            <span>{verification.documentTitle}</span>
          </div>
          <div className="detail-row">
            <label>File Name</label>
            <span>{verification.metadata.originalFileName}</span>
          </div>
          <div className="detail-row">
            <label>File Type</label>
            <span>{verification.metadata.fileType}</span>
          </div>
          <div className="detail-row">
            <label>File Size</label>
            <span>{(verification.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          {verification.metadata.issuer && (
            <div className="detail-row">
              <label>Issuer</label>
              <span>{verification.metadata.issuer}</span>
            </div>
          )}
          {verification.metadata.documentType && (
            <div className="detail-row">
              <label>Document Type</label>
              <span>{verification.metadata.documentType}</span>
            </div>
          )}
        </div>

        <div className="detail-card">
          <h3>Verification Details</h3>
          <div className="detail-row">
            <label>Status</label>
            <span className={`status-badge ${verification.verificationStatus}`}>
              {verification.verificationStatus}
            </span>
          </div>
          <div className="detail-row">
            <label>Method</label>
            <span>{verification.verificationMethod}</span>
          </div>
          <div className="detail-row">
            <label>Version</label>
            <span>{verification.verificationVersion}</span>
          </div>
          {verification.verifiedByUser && (
            <div className="detail-row">
              <label>Verified By</label>
              <span>{verification.verifiedByUser}</span>
            </div>
          )}
          {verification.verifiedAt && (
            <div className="detail-row">
              <label>Verified At</label>
              <span>{formatDate(verification.verifiedAt)}</span>
            </div>
          )}
          {verification.lastVerificationDate && (
            <div className="detail-row">
              <label>Last Verification</label>
              <span>{formatDate(verification.lastVerificationDate)}</span>
            </div>
          )}
          {verification.expiresAt && (
            <div className="detail-row">
              <label>Expires At</label>
              <span>{formatDate(verification.expiresAt)}</span>
            </div>
          )}
          {verification.revokedAt && (
            <div className="detail-row">
              <label>Revoked At</label>
              <span>{formatDate(verification.revokedAt)}</span>
            </div>
          )}
          {verification.revocationReason && (
            <div className="detail-row">
              <label>Revocation Reason</label>
              <span>{verification.revocationReason}</span>
            </div>
          )}
        </div>

        <div className="detail-card">
          <h3>Security Information</h3>
          <div className="detail-row">
            <label>Document Hash (SHA-256)</label>
            <span className="hash-value">{verification.documentHash.slice(0, 32)}...</span>
          </div>
          <div className="detail-row">
            <label>Checksum</label>
            <span className="hash-value">{verification.documentChecksum}</span>
          </div>
          <div className="detail-row">
            <label>Verification Token</label>
            <span className="hash-value">{verification.verificationToken.slice(0, 32)}...</span>
          </div>
          <div className="detail-row">
            <label>Created At</label>
            <span>{formatDate(verification.createdAt)}</span>
          </div>
          <div className="detail-row">
            <label>Updated At</label>
            <span>{formatDate(verification.updatedAt)}</span>
          </div>
        </div>
      </div>

      {showQR && verification.qrCodeUrl && (
        <div className="qr-modal">
          <div className="qr-content">
            <button className="icon-button" onClick={() => setShowQR(false)}>
              <X size={20} />
            </button>
            <h3>Verification QR Code</h3>
            <img src={verification.qrCodeUrl} alt="Verification QR Code" />
            <p>Scan this QR code to verify the document publicly</p>
            <button className="button primary" onClick={handleDownloadQR}>
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      )}

      <div className="verification-timeline">
        <h3>Verification History</h3>
        {verification.verificationHistory.length === 0 ? (
          <div className="empty-state">No verification history</div>
        ) : (
          <div className="timeline">
            {verification.verificationHistory.map((entry, index) => (
              <div key={index} className="timeline-item">
                <div className={`timeline-marker ${entry.result}`}>
                  {entry.result === "success" && <CheckCircle size={16} />}
                  {entry.result === "failure" && <XCircle size={16} />}
                  {entry.result === "mismatch" && <AlertTriangle size={16} />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-status">{entry.status}</span>
                    <span className="timeline-date">{formatDate(entry.verifiedAt)}</span>
                  </div>
                  <div className="timeline-details">
                    <span>Method: {entry.method}</span>
                    {entry.verifiedBy && <span>Verified by: {entry.verifiedBy}</span>}
                    {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                  </div>
                  {entry.notes && <p className="timeline-notes">{entry.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
