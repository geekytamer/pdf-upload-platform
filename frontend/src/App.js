// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import UploadPDF from "./UploadPDF";
import DocumentVerification from "./DocumentVerification";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
  };

  // Protected Route Component
  const ProtectedRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/" />;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        {isAuthenticated && (
          <>
            <button className="btn btn-secondary mb-4" onClick={handleLogout}>
              Logout
            </button>
            <nav>
              <Link to="/upload" className="btn btn-primary mr-4">
                Upload PDF
              </Link>
            </nav>
          </>
        )}

        <Routes>
          {/* Redirect to /upload if already authenticated and accessing the login route */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/upload" />
              ) : (
                <Login onLoginSuccess={() => setIsAuthenticated(true)} />
              )
            }
          />

          {/* Public Route for Document Verification */}
          <Route
            path="/verify/:documentId"
            element={<DocumentVerification />}
          />

          {/* Protected Route for Upload PDF */}
          <Route
            path="/upload"
            element={<ProtectedRoute element={<UploadPDF />} />}
          />

          {/* Catch-all route for redirect */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/upload" : "/"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
