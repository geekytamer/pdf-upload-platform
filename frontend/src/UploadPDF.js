// UploadPDF.js
import React, { useState } from "react";
import axios from "axios";

const UploadPDF = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Include the token in the Authorization header
      const response = await axios.post("/api/upload/pdf", formData, {
        headers: {
          Authorization: localStorage.getItem("adminToken"),
        },
      });

      const { downloadUrl } = response.data;

      setSuccessMessage("File uploaded successfully!");
      console.log(downloadUrl);
      // Trigger download of the modified PDF
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${file.name
        .split(".")
        .slice(0, -1)
        .join(".")}_modified.pdf`;
      link.click();
    } catch (err) {
      setError("Upload failed. Make sure you are logged in.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="card shadow-lg p-6 bg-base-100 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">Upload PDF Document</h2>
        <input
          type="file"
          accept="application/pdf"
          className="file-input file-input-bordered w-full max-w-xs mb-4"
          onChange={handleFileChange}
        />
        <button
          className="btn btn-primary w-full"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {successMessage && (
          <div className="alert alert-success mt-4">{successMessage}</div>
        )}
        {error && <div className="alert alert-error mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default UploadPDF;
