/**
 * Public Verification Page
 * Anyone can verify document authenticity using the verification token
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { api } from "../api.js";

export function PublicVerifyPage() {
  const { token } = useParams<{ token: string }>();
  
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      loadVerification();
    }
  }, [token]);

  const loadVerification = async () => {
    if (!token) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await api.publicVerify(token);
      setVerification(response.data);
    } catch (err: any) {
      setError(err.message || "Verification failed or token is invalid");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="text-green-500" size={48} />;
      case "rejected":
        return <XCircle className="text-red-500" size={48} />;
      case "pending":
        return <Clock className="text-yellow-500" size={48} />;
      case "expired":
        return <AlertTriangle className="text-orange-500" size={48} />;
      case "tampered":
        return <AlertTriangle className="text-red-600" size={48} />;
      case "revoked":
        return <XCircle className="text-gray-500" size={48} />;
      default:
        return <ShieldCheck size={48} />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "verified":
        return "This document has been verified and is authentic";
      case "rejected":
        return "This document has been rejected";
      case "pending":
        return "This document is pending verification";
      case "expired":
        return "This verification has expired";
      case "tampered":
        return "This document appears to have been tampered with";
      case "revoked":
        return "This verification has been revoked";
      default:
        return "Verification status unknown";
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

  if (loading) {
    return (
      <div className="public-verify-page">
        <div className="loading-state">Verifying document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-verify-page">
        <div className="error-card">
          <AlertTriangle size={48} className="text-red-500" />
          <h1>Verification Failed</h1>
          <p>{error}</p>
          <p className="hint">Please check the verification token and try again.</p>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="public-verify-page">
        <div className="error-card">
          <AlertTriangle size={48} className="text-red-500" />
          <h1>Document Not Found</h1>
          <p>The verification token is invalid or the document does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-verify-page">
      <div className="verify-header">
        <ShieldCheck size={32} />
        <h1>CertiVault Document Verification</h1>
        <p>Secure document authenticity verification</p>
      </div>

      <div className="verify-result-card">
        <div className="result-icon">
          {getStatusIcon(verification.verificationStatus)}
        </div>
        <h2 className="result-status">{verification.verificationStatus.toUpperCase()}</h2>
        <p className="result-message">{getStatusMessage(verification.verificationStatus)}</p>
      </div>

      <div className="verify-details">
        <h3>Document Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Document Title</label>
            <span>{verification.documentTitle}</span>
          </div>
          <div className="detail-item">
            <label>File Name</label>
            <span>{verification.metadata.originalFileName}</span>
          </div>
          <div className="detail-item">
            <label>File Type</label>
            <span>{verification.metadata.fileType}</span>
          </div>
          <div className="detail-item">
            <label>File Size</label>
            <span>{(verification.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          {verification.metadata.issuer && (
            <div className="detail-item">
              <label>Issuer</label>
              <span>{verification.metadata.issuer}</span>
            </div>
          )}
          {verification.metadata.documentType && (
            <div className="detail-item">
              <label>Document Type</label>
              <span>{verification.metadata.documentType}</span>
            </div>
          )}
        </div>
      </div>

      <div className="verify-details">
        <h3>Verification Details</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Verification Status</label>
            <span className={`status-badge ${verification.verificationStatus}`}>
              {verification.verificationStatus}
            </span>
          </div>
          <div className="detail-item">
            <label>Verification Method</label>
            <span>{verification.verificationMethod}</span>
          </div>
          <div className="detail-item">
            <label>Verification Version</label>
            <span>{verification.verificationVersion}</span>
          </div>
          {verification.verifiedByUser && (
            <div className="detail-item">
              <label>Verified By</label>
              <span>{verification.verifiedByUser}</span>
            </div>
          )}
          {verification.verifiedAt && (
            <div className="detail-item">
              <label>Verified At</label>
              <span>{formatDate(verification.verifiedAt)}</span>
            </div>
          )}
          {verification.lastVerificationDate && (
            <div className="detail-item">
              <label>Last Verification</label>
              <span>{formatDate(verification.lastVerificationDate)}</span>
            </div>
          )}
          {verification.expiresAt && (
            <div className="detail-item">
              <label>Expires At</label>
              <span>{formatDate(verification.expiresAt)}</span>
            </div>
          )}
          {verification.revokedAt && (
            <div className="detail-item">
              <label>Revoked At</label>
              <span>{formatDate(verification.revokedAt)}</span>
            </div>
          )}
          {verification.revocationReason && (
            <div className="detail-item">
              <label>Revocation Reason</label>
              <span>{verification.revocationReason}</span>
            </div>
          )}
        </div>
      </div>

      <div className="verify-details">
        <h3>Security Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Document Hash (SHA-256)</label>
            <span className="hash-value">{verification.documentHash}</span>
          </div>
          <div className="detail-item">
            <label>Checksum</label>
            <span className="hash-value">{verification.documentChecksum}</span>
          </div>
          <div className="detail-item">
            <label>Created At</label>
            <span>{formatDate(verification.createdAt)}</span>
          </div>
          <div className="detail-item">
            <label>Updated At</label>
            <span>{formatDate(verification.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="verify-footer">
        <ShieldCheck size={16} />
        <span>Powered by CertiVault Enterprise Document Verification System</span>
      </div>
    </div>
  );
}
