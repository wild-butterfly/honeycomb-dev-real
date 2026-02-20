// src/pages/FilesPhotosPage.tsx
// Created by Honeycomb © 2026
// Files & Photos - Document management and media storage

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./FilesPhotosPage.module.css";
import {
  FolderIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { apiGet, apiPost, apiDelete, logout } from "../services/api";
import DashboardNavbar from "../components/DashboardNavbar";
import LeftSidebar from "../components/LeftSidebar";
import Footer from "../components/Footer";

interface FileItem {
  id: number;
  job_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  folder: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
  file_url: string;
}

const FilesPhotosPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = [
    { value: "all", label: "All Files & Photos (0)" },
    { value: "reports", label: "Reports" },
    { value: "invoices", label: "Invoices" },
    { value: "photos", label: "Photos" },
    { value: "documents", label: "Documents" },
  ];

  useEffect(() => {
    if (jobId) {
      loadFiles();
    }
  }, [jobId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const folder = selectedFolder === "all" ? "" : selectedFolder;
      const query = folder ? `?folder=${folder}` : "";
      const data = await apiGet<FileItem[]>(`/jobs/${jobId}/files${query}`);
      setFiles(data || []);
    } catch (err) {
      console.error("Failed to load files", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (fileList: File[]) => {
    try {
      setUploading(true);

      // Validate file size (max 20MB)
      const maxSize = 20 * 1024 * 1024;
      const oversizedFiles = fileList.filter((f) => f.size > maxSize);

      if (oversizedFiles.length > 0) {
        alert(
          `Some files exceed 20MB limit: ${oversizedFiles.map((f) => f.name).join(", ")}`,
        );
        return;
      }

      // Upload files to backend
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append("files", file);
      });
      formData.append(
        "folder",
        selectedFolder === "all" ? "documents" : selectedFolder,
      );

      await apiPost(`/jobs/${jobId}/files`, formData);

      alert(`Successfully uploaded ${fileList.length} file(s)`);

      // Reload files
      await loadFiles();
    } catch (err) {
      console.error("Failed to upload files", err);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map((f) => f.id));
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!window.confirm(`Delete ${selectedFiles.length} file(s)?`)) return;

    try {
      await apiDelete(`/jobs/${jobId}/files/batch`, { ids: selectedFiles });

      alert(`Successfully deleted ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
      await loadFiles();
    } catch (err) {
      console.error("Failed to delete files", err);
      alert("Failed to delete files");
    }
  };

  const handleDownloadZip = () => {
    if (selectedFiles.length === 0) return;
    // TODO: Download selected files as zip
    console.log("Download files:", selectedFiles);
    alert("Download feature coming soon!");
  };

  const filteredFiles = files.filter((file) => {
    const matchesFolder =
      selectedFolder === "all" || file.folder === selectedFolder;
    const matchesSearch =
      searchQuery === "" ||
      file.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <DashboardNavbar onLogout={logout} />

      <div className={styles.pageWrapper}>
        <LeftSidebar />

        <div className={styles.main}>
          <div className={styles.pageContainer}>
            {/* HEADER */}
            <div className={styles.header}>
              <FolderIcon className={styles.headerIcon} />
              <h1 className={styles.title}>Files & Photos</h1>
            </div>

            <div className={styles.subtitle}>
              Drag & drop files here or click to browse. Max 20MB per file.
            </div>

            {/* UPLOAD AREA */}
            <div
              className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ""} ${uploading ? styles.uploading : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className={styles.fileInput}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.mov"
                disabled={uploading}
              />

              <CloudArrowUpIcon className={styles.uploadIcon} />

              <div className={styles.uploadText}>
                {uploading ? "Uploading..." : "Drag & drop files here or"}
              </div>

              <button
                className={styles.chooseButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Choose Files...
              </button>

              <div className={styles.supportedFiles}>
                Supported files: jpg, png, csv, pdf, xls, mov, mp4 and more. Max
                20 MB
              </div>
            </div>

            {/* TOOLBAR */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.folderSelector}>
                  <label className={styles.folderLabel}>Select folder</label>
                  <select
                    className={styles.folderDropdown}
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                  >
                    {folders.map((folder) => (
                      <option key={folder.value} value={folder.value}>
                        {folder.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.toolbarRight}>
                <div className={styles.searchBox}>
                  <MagnifyingGlassIcon className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by ID or filename"
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* FILE ACTIONS */}
            <div className={styles.fileActions}>
              <div className={styles.fileCount}>
                {selectedFiles.length} ({filteredFiles.length}) files selected
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionButton}
                  onClick={handleSelectAll}
                >
                  Select all
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleDelete}
                  disabled={selectedFiles.length === 0}
                >
                  <TrashIcon className={styles.actionIcon} />
                  Delete
                </button>
                <button
                  className={styles.actionButton}
                  onClick={handleDownloadZip}
                  disabled={selectedFiles.length === 0}
                >
                  <ArrowDownTrayIcon className={styles.actionIcon} />
                  Download Zip
                </button>
              </div>
            </div>

            {/* FILE LIST */}
            <div className={styles.fileList}>
              {loading && <div className={styles.empty}>Loading files...</div>}

              {!loading && filteredFiles.length === 0 && (
                <div className={styles.emptyState}>
                  <FolderIcon className={styles.emptyIcon} />
                  <div className={styles.emptyTitle}>
                    There are no files in this folder
                  </div>
                  <div className={styles.emptyText}>
                    Add files by drag & dropping the file into the blue area
                    above or press Choose Files to browse for files. Maximum
                    file size 20mb.
                  </div>
                </div>
              )}

              {!loading && filteredFiles.length > 0 && (
                <div className={styles.fileGrid}>
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`${styles.fileCard} ${selectedFiles.includes(file.id) ? styles.selected : ""}`}
                      onClick={() => {
                        if (selectedFiles.includes(file.id)) {
                          setSelectedFiles(
                            selectedFiles.filter((id) => id !== file.id),
                          );
                        } else {
                          setSelectedFiles([...selectedFiles, file.id]);
                        }
                      }}
                    >
                      <div className={styles.filePreview}>
                        {file.file_type.startsWith("image/") ? (
                          <img
                            src={file.file_url}
                            alt={file.original_filename}
                            className={styles.fileImage}
                          />
                        ) : (
                          <div className={styles.fileIcon}>
                            {file.file_type.split("/")[1]}
                          </div>
                        )}
                      </div>

                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>
                          {file.original_filename}
                        </div>
                        <div className={styles.fileMeta}>
                          {formatFileSize(file.file_size)} •{" "}
                          {file.uploaded_by_name || "System"}
                        </div>
                      </div>

                      {selectedFiles.includes(file.id) && (
                        <div className={styles.selectedBadge}>✓</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FilesPhotosPage;
