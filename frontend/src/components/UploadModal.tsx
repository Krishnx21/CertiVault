import { useRef, useState, useEffect } from "react";
import { CloudUpload, FileCheck2, Upload, X, CheckCircle2, AlertCircle, RefreshCw, FileText } from "lucide-react";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
  /** When set, the uploaded document will be owned by the vault owner (editor upload) */
  vaultOwnerId?: string;
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/zip",
  "application/x-zip-compressed",
];

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function UploadModal({ onClose, onUploaded, vaultOwnerId }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("certificate");
  const [tags, setTags] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generatePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      setPreview("pdf");
    } else {
      setPreview(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File size exceeds 50MB limit");
        return;
      }

      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setError("File type not allowed. Please upload PDF, DOC, DOCX, PNG, JPG, or ZIP files.");
        return;
      }

      setFile(selectedFile);
      generatePreview(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setError("");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File size exceeds 50MB limit");
        return;
      }

      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setError("File type not allowed. Please upload PDF, DOC, DOCX, PNG, JPG, or ZIP files.");
        return;
      }

      setFile(selectedFile);
      generatePreview(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setError("");
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const retryUpload = () => {
    setError("");
    setUploadStatus("idle");
    setUploadProgress(0);
  };

  const submit = async () => {
    if (!file) return setError("Choose a document first.");
    if (!title.trim()) return setError("Title is required.");
    
    setUploadStatus("uploading");
    setUploadProgress(0);
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
    // Editor uploading to a vault owner's vault
    if (vaultOwnerId) {
      data.append("vaultOwnerId", vaultOwnerId);
    }

    abortControllerRef.current = new AbortController();

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          setUploadStatus("success");
          setTimeout(() => {
            onUploaded();
            resolve();
          }, 1500);
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            setError(body.error?.message || "Upload failed");
          } catch {
            setError("Upload failed");
          }
          setUploadStatus("error");
          setUploadProgress(0);
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => {
        setError("Upload failed");
        setUploadStatus("error");
        setUploadProgress(0);
        reject(new Error("Upload failed"));
      });

      xhr.addEventListener("abort", () => {
        setError("Upload cancelled");
        setUploadStatus("error");
        setUploadProgress(0);
        reject(new Error("Upload cancelled"));
      });

      xhr.open("POST", `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/documents`);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("accessToken")}`);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.signal.addEventListener("abort", () => {
          xhr.abort();
        });
      }

      xhr.send(data);
    });
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-lg" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={19} />
        </button>
        
        {uploadStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Upload Successful!</h2>
            <p className="text-[var(--text-secondary)]">Your document has been securely uploaded.</p>
          </div>
        ) : (
          <>
            <div className="modal-heading">
              <div className="modal-mark">
                <CloudUpload />
              </div>
              <div>
                <h2>Upload document</h2>
                <p>Add a file to your secure workspace.</p>
              </div>
            </div>

            <div className="modal-content">
              <div
                className={`dropzone ${file ? "has-file" : ""} ${isDragging ? "dragging" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                  onChange={handleFileChange}
                  disabled={uploadStatus === "uploading"}
                />
                {file ? (
                  <div className="file-preview">
                    {preview === "pdf" ? (
                      <div className="preview-icon">
                        <FileText size={48} />
                      </div>
                    ) : preview ? (
                      <img src={preview} alt="Preview" className="preview-image" />
                    ) : (
                      <div className="preview-icon">
                        <FileCheck2 size={48} />
                      </div>
                    )}
                    <div className="file-info">
                      <strong className="truncate">{file.name}</strong>
                      <span>{formatBytes(file.size)}</span>
                    </div>
                    <button
                      className="icon-button remove-file"
                      onClick={(e) => { e.stopPropagation(); removeFile(); }}
                      disabled={uploadStatus === "uploading"}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <Upload size={48} />
                    <strong>Drag & drop your file here</strong>
                    <span>or click to browse</span>
                    <small>PDF, DOC, DOCX, PNG, JPG, or ZIP · Up to 50 MB</small>
                  </div>
                )}
              </div>

              {uploadStatus === "uploading" && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    <span>Uploading... {uploadProgress}%</span>
                    <button className="button ghost text-xs" onClick={cancelUpload}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {uploadStatus === "error" && (
                <div className="upload-error">
                  <div className="flex items-center gap-2 text-red-500 mb-2">
                    <AlertCircle size={20} />
                    <span className="font-medium">Upload failed</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">{error}</p>
                  <button className="button secondary text-sm" onClick={retryUpload}>
                    <RefreshCw size={16} /> Retry
                  </button>
                </div>
              )}

              <div className="form-fields">
                <label className="field-label">
                  Title
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Document title"
                    maxLength={255}
                    disabled={uploadStatus === "uploading"}
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
                    disabled={uploadStatus === "uploading"}
                  />
                </label>
                
                <label className="field-label">
                  Category
                  <select 
                    value={category} 
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={uploadStatus === "uploading"}
                  >
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
                    disabled={uploadStatus === "uploading"}
                  />
                </label>
              </div>

              {error && uploadStatus !== "error" && <p className="form-error">{error}</p>}
            </div>

            <div className="modal-actions">
              <button 
                className="button ghost" 
                onClick={onClose} 
                disabled={uploadStatus === "uploading"}
              >
                Cancel
              </button>
              <button 
                className="button primary" 
                onClick={submit} 
                disabled={uploadStatus === "uploading" || !file}
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} /> Upload securely
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
