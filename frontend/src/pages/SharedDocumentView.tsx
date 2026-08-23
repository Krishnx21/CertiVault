import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, Lock, AlertCircle, Eye, FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Input from "../components/Input.js";
import { api } from "../api.js";
import type { PublicShareInfo, ShareAccessResult } from "../types.js";

// pdf.js renders pages to <canvas> ourselves — no native PDF toolbar means no
// built-in download/print button reaches the recipient.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type FileKind = "pdf" | "image" | "unsupported" | null;

// Hide everything if the recipient tries to print the page.
const PRINT_CSS = `@media print { body { display: none !important; } }`;

const centered: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-primary)",
};

/**
 * Public, account-less view-only page for a single shared document.
 *
 * Flow: load public metadata → (password prompt) → accessShare mints a scoped
 * view token → fetch the bytes with that token → render inline. The file is
 * never offered as a download and the token unlocks only this one document.
 */
const SharedDocumentView: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [info, setInfo] = useState<PublicShareInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [access, setAccess] = useState<ShareAccessResult | null>(null);

  const [kind, setKind] = useState<FileKind>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const autoUnlockedRef = useRef(false);

  const prevent = useCallback((e: React.SyntheticEvent) => e.preventDefault(), []);

  // Deterrence: block Ctrl/Cmd+S (save) and Ctrl/Cmd+P (print) while viewing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load public metadata for the share (never includes bytes or the password).
  useEffect(() => {
    if (!token) {
      setInfoError("This share link is invalid.");
      setLoadingInfo(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getShareByToken(token);
        if (!cancelled) setInfo(res.data);
      } catch (e) {
        if (!cancelled) {
          setInfoError((e as Error).message || "This share link is no longer available.");
        }
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const doAccess = useCallback(
    async (pwd: string | undefined) => {
      if (!token) return;
      setUnlocking(true);
      setUnlockError(null);
      try {
        const res = await api.accessShare(token, pwd);
        setAccess(res.data);
      } catch (e) {
        setUnlockError((e as Error).message || "Unable to open this document.");
      } finally {
        setUnlocking(false);
      }
    },
    [token]
  );

  // Links with no password unlock automatically (still mints a scoped token).
  useEffect(() => {
    if (info && !info.requiresPassword && !access && !autoUnlockedRef.current) {
      autoUnlockedRef.current = true;
      void doAccess(undefined);
    }
  }, [info, access, doAccess]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    void doAccess(password);
  };

  // Revoke the previous image object URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Fetch + render the file bytes once a view token has been obtained.
  useEffect(() => {
    if (!access || !token) return;
    let cancelled = false;
    (async () => {
      setLoadingFile(true);
      setFileError(null);
      try {
        const blob = await api.getSharedFileBlob(token, access.viewToken);
        if (cancelled) return;
        const mime = (access.document.mimeType || blob.type || "").toLowerCase();

        if (mime === "application/pdf") {
          setKind("pdf");
          const buf = await blob.arrayBuffer();
          if (cancelled) return;
          const container = pdfContainerRef.current;
          if (!container) return;
          container.innerHTML = "";
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
          for (let n = 1; n <= pdf.numPages; n++) {
            if (cancelled) break;
            const page = await pdf.getPage(n);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            canvas.style.maxWidth = `${viewport.width}px`;
            canvas.style.margin = "0 auto 16px";
            canvas.style.borderRadius = "6px";
            canvas.style.boxShadow = "0 2px 12px rgba(0,0,0,0.35)";
            canvas.style.display = "block";
            container.appendChild(canvas);
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        } else if (mime.startsWith("image/")) {
          const url = URL.createObjectURL(blob);
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          setImageUrl(url);
          setKind("image");
        } else {
          setKind("unsupported");
        }
      } catch (e) {
        if (!cancelled) setFileError((e as Error).message || "Failed to load this document.");
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [access, token]);

  // ── Loading metadata ──────────────────────────────────────────────────────
  if (loadingInfo) {
    return (
      <div style={centered}>
        <div className="spinner" />
      </div>
    );
  }

  // ── Invalid / expired / revoked link ──────────────────────────────────────
  if (infoError) {
    return (
      <div style={centered}>
        <div className="auth-card" style={{ textAlign: "center", maxWidth: 420 }}>
          <div className="auth-brand-mark" style={{ margin: "0 auto 1rem" }}>
            <AlertCircle size={26} />
          </div>
          <h1 style={{ marginBottom: ".5rem" }}>Link unavailable</h1>
          <p style={{ color: "var(--text-secondary)" }}>{infoError}</p>
        </div>
      </div>
    );
  }

  // ── Locked: password prompt (or auto-unlock spinner) ──────────────────────
  if (!access) {
    return (
      <div className="auth-page">
        <style>{PRINT_CSS}</style>
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <ShieldCheck size={26} />
            </div>
            <h1>{info?.documentTitle ?? "Shared document"}</h1>
            <p>
              {info?.ownerName
                ? `${info.ownerName} shared this document with you`
                : "Enter the password to view this document"}
            </p>
          </div>

          {unlockError && (
            <div className="auth-error" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{unlockError}</span>
            </div>
          )}

          {info?.requiresPassword ? (
            <form
              onSubmit={handleUnlock}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <Input
                id="share-password"
                name="password"
                type="password"
                label="Password"
                leftIcon={Lock}
                showPasswordToggle
                autoComplete="off"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setUnlockError(null);
                }}
                placeholder="Enter the password"
              />
              <button
                type="submit"
                disabled={unlocking || !password}
                className="button primary"
                style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
              >
                {unlocking ? (
                  <>
                    <div className="spinner spinner-sm" aria-hidden="true" />
                    Unlocking…
                  </>
                ) : (
                  <>
                    <Eye size={17} aria-hidden="true" />
                    Unlock &amp; view
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
              <div className="spinner" />
            </div>
          )}

          <p
            style={{
              marginTop: "1.25rem",
              fontSize: ".8125rem",
              color: "var(--text-muted)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            This document is <strong>view-only</strong>. It can't be downloaded or edited. If you
            were given a password, enter it above.
          </p>
        </div>
      </div>
    );
  }

  // ── Unlocked: inline view-only viewer ─────────────────────────────────────
  return (
    <div
      onContextMenu={prevent}
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        userSelect: "none",
        WebkitUserSelect: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{PRINT_CSS}</style>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <ShieldCheck size={20} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {access.document.title}
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>
              Shared by {info?.ownerName ?? "the owner"}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: ".75rem",
            fontWeight: 600,
            color: "var(--accent-blue)",
            border: "1px solid var(--border-color)",
            borderRadius: 999,
            padding: "4px 10px",
            flexShrink: 0,
          }}
        >
          <Eye size={14} aria-hidden="true" /> View only
        </div>
      </header>

      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {loadingFile && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              marginTop: "10vh",
              color: "var(--text-secondary)",
            }}
          >
            <div className="spinner" />
            <span>Loading document…</span>
          </div>
        )}

        {fileError && (
          <div className="auth-error" role="alert" style={{ maxWidth: 480 }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>{fileError}</span>
          </div>
        )}

        {/* PDF pages are appended imperatively by pdf.js; React leaves this empty. */}
        <div
          ref={pdfContainerRef}
          style={{ display: kind === "pdf" ? "block" : "none", width: "100%", maxWidth: 900 }}
        />

        {kind === "image" && imageUrl && (
          <div style={{ position: "relative", maxWidth: "100%" }}>
            <img
              src={imageUrl}
              alt={access.document.fileName}
              draggable={false}
              onDragStart={prevent}
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: 8,
                boxShadow: "0 2px 16px rgba(0,0,0,.4)",
                display: "block",
                pointerEvents: "none",
              }}
            />
            {/* Transparent overlay blunts long-press / drag "save image" on the picture. */}
            <div style={{ position: "absolute", inset: 0 }} />
          </div>
        )}

        {kind === "unsupported" && !loadingFile && (
          <div
            style={{
              textAlign: "center",
              marginTop: "10vh",
              color: "var(--text-secondary)",
              maxWidth: 420,
            }}
          >
            <FileText size={48} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
            <h2 style={{ marginBottom: ".5rem", color: "var(--text-primary)" }}>
              Preview not available
            </h2>
            <p>
              A preview isn't available for this file type, and downloading is disabled for this
              shared document.
            </p>
          </div>
        )}
      </main>

      <footer
        style={{
          padding: "10px 20px",
          borderTop: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          fontSize: ".75rem",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        You're viewing a document shared securely via CertiVault. Downloading and printing are
        disabled.
      </footer>
    </div>
  );
};

export default SharedDocumentView;
