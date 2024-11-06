// DocumentVerification.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const DocumentVerification = () => {
  const { documentId } = useParams(); // Get the document ID from the URL
  const [statusMessage, setStatusMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    const checkDocumentExistence = async () => {
      try {
        console.log(process.env.REACT_APP_API_URL);
        // Use the document ID from the URL to check if the document exists
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/download/${documentId}`
        );

        if (response.status === 200) {
          setStatusMessage("Document found!");
          setDownloadUrl(
            `${process.env.REACT_APP_API_URL}/api/download/${documentId}`
          );
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setStatusMessage("Document not found.");
        } else {
          setStatusMessage("An error occurred. Please try again.");
        }
      }
    };

    // Call the function to check the document's existence on component mount
    checkDocumentExistence();
  }, [documentId]);

  return (
    <div className="container mx-auto p-8">
      <div className="card shadow-lg p-6 bg-base-100 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Document Verification</h2>

        {statusMessage && <p className="text-center mb-4">{statusMessage}</p>}

        {downloadUrl && (
          <a href={downloadUrl} download className="btn btn-secondary w-full">
            Download Digital Copy
          </a>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;
