import { useRef, useState } from "react";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("certificate");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!file) return setError("Choose a document first.");
    if (!title.trim()) return setError("Title is required.");
    
    setBusy(true);
    setError("");

    const data = new FormData();
    data.append("file", file);
    data.append("title", title);
    if (description) data.append("description", description);
    data.append("category", category);
    if (tags) {
      const tagArray = tags.split(",").map(t => t.trim()).filter(t => t.length > 0);
      tagArray.forEach(tag => data.append("tags", tag));
    }

    try {
      await api.uploadDocument(data);
      onUploaded();
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setBusy(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/zip",
        "application/x-zip-compressed",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("File type not allowed. Please upload PDF, DOC, DOCX, PNG, JPG, or ZIP files.");
        return;
      }

      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setError("");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const fileInput = inputRef.current;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        fileInput.files = dataTransfer.files;
        handleFileChange({ target: fileInput } as React.ChangeEvent<HTMLInputElement>);
      }
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
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
            onChange={handleFileChange}
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
              <span>PDF, DOC, DOCX, PNG, JPG, or ZIP · Up to 50 MB</span>
            </>
          )}
        </button>
        <label className="field-label">
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Document title"
            maxLength={255}
          />
        </label>
        <label className="field-label">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description"
            rows={3}
            maxLength={2000}
          />
        </label>
        <label className="field-label">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="certificate">Certificate</option>
            <option value="contract">Contract</option>
            <option value="identity">Identity</option>
            <option value="invoice">Invoice</option>
            <option value="report">Report</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="field-label">
          Tags (comma-separated)
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="e.g., important, finance, 2026"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="button ghost" onClick={onClose} disabled={busy}>
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
