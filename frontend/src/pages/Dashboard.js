import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Dashboard.css";
import logo from "../assets/logo1.png"; // Importar el logo
import 'bootstrap-icons/font/bootstrap-icons.css'; // Asegúrate de tener esta importación
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState('overview');
  const [mainContent, setMainContent] = useState('overview');
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Move fetchUserData outside useEffect
  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    console.log("API Base URL:", process.env.REACT_APP_API_BASE_URL);
    
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Get user data
      const userResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/me`, {
        headers: { Authorization: token },
      });
      setUser(userResponse.data);
      setIsAdmin(userResponse.data.role === 'admin');

      // Get user status
      const statusResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/status`, {
        headers: { Authorization: token },
      });
      console.log("Status received:", statusResponse.data); // For debugging
      setStatus(statusResponse.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  // Add a debug effect to log the user's cvPath whenever it changes
  useEffect(() => {
    if (user) {
      console.log("Current user cvPath:", user.cvPath);
    }
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a PDF file.");
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users/upload-cv`, formData, {
        headers: { "Authorization": token, "Content-Type": "multipart/form-data" },
      });
      setMessage("Report uploaded successfully.");
      setShowModal(false);
      window.location.reload();
    } catch (error) {
      setMessage("Error uploading file.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const calculateProgress = () => {
    if (!status) return 0;
    const total = 2; // Total number of tasks
    let completed = 0;
    if (status.cvUploaded) completed++;
    if (status.cvAnalyzed) completed++;
 
    return (completed / total) * 100;
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    switch(section) {
      default:
        setMainContent('overview');
        break;
    }
  };

  const handleInterviewResults = () => {
    setActiveSection('overview');
    if (status?.interviewCompleted) {
      navigate('/interview-results');
    }
  };

  const handleViewReport = async () => {
    console.log("View report clicked, user object:", user);
    
    try {
      // Get the CV path directly from the API
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/cv`, {
        headers: { Authorization: token },
      });
      
      console.log("CV path response:", response.data);
      
      if (response.data && response.data.filePath) {
        // Open the PDF in a new tab
        console.log("Opening URL:", response.data.filePath);
        window.open(response.data.filePath, '_blank');
      } else {
        toast.error("No report path found in the response");
      }
    } catch (error) {
      console.error("Error fetching or opening PDF:", error);
      if (error.response && error.response.status === 404) {
        toast.error("No report available to view");
      } else {
        toast.error("Error opening the PDF");
      }
    }
  };

  const handleDeleteReport = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.')) {
      try {
        // First check if the CV exists
        const token = localStorage.getItem("token");
        
        try {
          // Try to get the CV path first to confirm it exists
          await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/cv`, {
            headers: { Authorization: token },
          });
        } catch (error) {
          // If 404, the CV doesn't exist
          if (error.response && error.response.status === 404) {
            toast.error("No report to delete");
            return;
          }
          // For other errors, continue with deletion attempt
        }
        
        console.log("Proceeding with CV deletion");
        
        // Delete the CV
        const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/users/delete-cv`, {
          headers: {
            Authorization: token
          }
        });

        console.log("Delete response:", response.data);

        // Refresh user data after deletion
        await fetchUserData();
        
        toast.success('Report deleted successfully');
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Error deleting report. Please try again.');
      }
    }
  };

  const handleDeleteInterview = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/users/delete-interview`, {
        headers: { Authorization: token },
      });
      window.location.reload();
    } catch (error) {
      console.error("Error al eliminar la entrevista:", error);
    }
  };

  const renderProfileCard = () => (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-info">
          <h3>{user?.name}</h3>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>
      <div className="profile-details">
        <h4 className="section-title mb-3">Academic Information</h4>
        
        <div className="detail-item">
          <i className="bi bi-building"></i>
          <div className="detail-content">
            <span className="detail-label">Institution: </span>
            <span className="detail-value">{user?.institution || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-award"></i>
          <div className="detail-content">
            <span className="detail-label">Academic Title: </span>
            <span className="detail-value">{user?.title || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-journal-text"></i>
          <div className="detail-content">
            <span className="detail-label">Module: </span>
            <span className="detail-value">{user?.module || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-hash"></i>
          <div className="detail-content">
            <span className="detail-label">Programme Code: </span>
            <span className="detail-value">{user?.programme_code || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-book"></i>
          <div className="detail-content">
            <span className="detail-label">Program or Major: </span>
            <span className="detail-value">{user?.program || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  return (
    <>
      {/* Navbar with reduced height */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-gray py-2 fixed-top">
        <div className="container-fluid px-3">
          <div className="navbar-brand-container d-flex align-items-center">
            <a className="navbar-brand h1 text_format d-none d-lg-block" href="#" style={{ color: "#fff" }}>
              MIRAI Academic
            </a>
            <a className="navbar-brand h1 text_format d-lg-none" href="#" style={{ color: "#fff" }}>
              MIRAI
            </a>
          </div>
          
          {/* Botón para mostrar/ocultar sidebar en móvil */}
          <button
            className="btn btn-link d-lg-none me-3"
            onClick={toggleSidebar}
            style={{ color: 'white' }}
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              {/* Dashboard button to return to main view */}
              <li className="nav-item">
                <Link className="nav-link px-3" to="/dashboard">
                  <i className="bi bi-house-door"></i> Dashboard
                </Link>
              </li>
              
              <li className="nav-item">
                <button className="nav-link px-3" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Dashboard Layout - Full width, left aligned */}
      <div className="dashboard-layout">
        {/* Overlay para cerrar el sidebar en móvil */}
        <div 
          className={`sidebar-overlay ${showSidebar ? 'show' : ''}`} 
          onClick={closeSidebar}
        ></div>

        {/* Sidebar - Positioned like AdminDashboard */}
        <div className={`dashboard-sidebar ${showSidebar ? 'show' : ''}`}>
          <div className="sidebar-header">
            <img src={logo} alt="MIRAI Logo" className="sidebar-logo" />
          </div>
          
          <div className="sidebar-menu">
            <button 
              className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => handleSectionChange('overview')}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Overview</span>
            </button>

            {/* Interview results button */}
            {status?.interviewCompleted && (
              <button 
                className={`menu-item ${activeSection === 'interview-results' ? 'active' : ''}`}
                onClick={handleInterviewResults}
              >
                <i className="bi bi-chat-dots-fill"></i>
                <span>Interview</span>
              </button>
            )}
            
            {/* Admin Dashboard button - only visible for admin users */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="menu-item"
              >
                <i className="bi bi-shield-lock"></i>
                <span>Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Logout button */}
          <button 
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-left"></i>
            <span>Logout</span>
          </button>
        </div>

        {/* Main Content - Left aligned with padding */}
        <div className="dashboard-main">
          <div className="px-3">
            <div className="dashboard-header">
              <div className="header-welcome">
                <h2>Welcome back, {user?.name}</h2>
                <p>Here's a summary of your progress</p>
              </div>
              <div className="progress-circle-container">
                <div 
                  className="progress-circle" 
                  style={{ "--progress": `${calculateProgress() * 3.6}deg` }}
                >
                  <div className="progress-circle-content">
                    <div className="progress-value">{Math.round(calculateProgress())}%</div>
                    <div className="progress-text">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-content">
              <div className="content-left">
                {renderProfileCard()}
              </div>
              <div className="content-right">
                <div className="dashboard-stats">
                  <div className={`stat-card ${status?.cvUploaded ? 'completed' : 'pending'}`}>
                    <i className="bi bi-file-earmark-check icon-feature"></i>
                    <div className="stat-info">
                      <h4>Report Status</h4>
                      <p>
                        <span className={`status-dot ${status?.cvUploaded ? 'completed' : 'pending'}`}></span>
                        {status?.cvUploaded ? 'Uploaded' : 'Pending'}
                      </p>
                      {!status?.cvUploaded && (
                        <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}>
                          <i className="bi bi-upload"></i> Upload Report
                        </button>
                      )}
                      {status?.cvUploaded && (
                        <div className="cv-actions mt-2">
                          {!status?.cvAnalyzed && (
                            <Link to="/analyze-cv" className="btn btn-secondary">
                              <i className="bi bi-search"></i> Analyse
                            </Link>
                          )}
                          <button 
                            className="btn btn-info me-2" 
                            onClick={handleViewReport}
                            title="Download Report"
                          >
                            <i className="bi bi-eye"></i> Download
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={handleDeleteReport}
                            title="Delete report"
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`stat-card ${status?.interviewCompleted ? 'completed' : 'pending'}`}>
                    <i className="bi bi-chat-dots icon-feature"></i>
                    <div className="stat-info">
                      <h4>Report Interview</h4>
                      <p>
                        <span className={`status-dot ${status?.interviewCompleted ? 'completed' : 'pending'}`}></span>
                        {status?.interviewCompleted ? 'Completed' : 'Pending'}
                      </p>
                      <div className="d-flex gap-2 mt-2">
                        {status?.cvAnalyzed && !status?.interviewCompleted && (
                          <Link to="/analyze-cv" className="btn btn-primary">
                            <i className="bi bi-chat"></i> Take Interview
                          </Link>
                        )}
                        {status?.interviewCompleted && (
                          <>
                            <Link to="/interview-results" className="btn btn-secondary">
                              <i className="bi bi-graph-up"></i> View Results
                            </Link>
                            <button 
                              className="btn btn-danger" 
                              onClick={handleDeleteInterview}
                              title="Delete interview"
                            >
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </>
                        )}
                        {!status?.cvAnalyzed && (
                          <span className="text-muted d-block">Upload and analyze your report first</span>
                        )}
                      </div>
                    </div>
                  </div>  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Upload Report</h4>
              <button className="close-button" onClick={() => setShowModal(false)}>
                ✖️
              </button>
            </div>
            <div className="modal-body">
              <div className="file-upload-container">
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={(e) => setFile(e.target.files[0])}
                  id="cv-upload"
                />
                <label htmlFor="cv-upload">
                  📤 Choose PDF File
                </label>
              </div>
              {file && <div className="selected-file">{file.name}</div>}
              {message && <p className="message">{message}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpload}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
