import React, { useRef, useState } from "react";
import { CloudUpload, FileCheck2, Upload, X } from "lucide-react";
import { api } from "../api.js";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

export function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("Certificate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!file) return setError("Choose a document first.");
    setBusy(true);
    setError("");
    const data = new FormData();
    data.append("file", file);
    data.append("type", type);
    try {
      await api.uploadDocument(data);
      onUploaded();
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={19} />
        </button>
        <div className="modal-heading">
          <div className="modal-mark">
            <CloudUpload />
          </div>
          <div>
            <h2>Upload document</h2>
            <p>Add a file to your secure workspace.</p>
          </div>
        </div>
        <button
          className={`dropzone ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(event) => {
              const files = event.target.files;
              if (files && files.length > 0) {
                setFile(files[0]);
              }
            }}
          />
          {file ? (
            <>
              <FileCheck2 size={34} />
              <strong>{file.name}</strong>
              <span>{formatBytes(file.size)} · Click to replace</span>
            </>
          ) : (
            <>
              <Upload size={34} />
              <strong>Choose a file to upload</strong>
              <span>PDF, image, or document · Up to 10 MB</span>
            </>
          )}
        </button>
        <label className="field-label">
          Document type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option>Certificate</option>
            <option>Contract</option>
            <option>Identity</option>
            <option>Financial</option>
            <option>Other</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="button ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" onClick={submit} disabled={busy}>
            {busy ? "Securing…" : "Upload securely"}
          </button>
        </div>
      </div>
    </div>
  );
}
