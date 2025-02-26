import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Dashboard.css";
import logo from "../assets/logo1.png"; // Importar el logo
import 'bootstrap-icons/font/bootstrap-icons.css'; // Asegúrate de tener esta importación

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

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
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

    fetchUserData();
  }, [navigate]);

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
      case 'cv':
        if (status?.cvUploaded) {
          navigate('/analyze-cv');
        } else {
          setShowModal(true);
        }
        break;
      
      case 'skills':
        // Mostrar menú de evaluaciones
        setMainContent('skills');
        break;
        
      default:
        setMainContent('overview');
        break;
    }
  };

  const handleInterviewResults = () => {
    if (status?.interviewCompleted) {
      navigate('/interview-results');
    }
  };

  const handleDeleteReport = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/users/delete-cv`, {
        headers: { Authorization: token },
      });
      window.location.reload();
    } catch (error) {
      console.error("Error al eliminar el reporte:", error);
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
        <div className="detail-item">
          <i className="bi bi-telephone"></i>
          <div className="detail-content">
            <span className="detail-label">Phone: </span>
            <span className="detail-value">{user?.phone || 'Not specified'}</span>
          </div>
        </div>
        
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
            <span className="detail-label">Title: </span>
            <span className="detail-value">{user?.title || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-mortarboard"></i>
          <div className="detail-content">
            <span className="detail-label">Academic Level: </span>
            <span className="detail-value">{user?.academic_level || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-book"></i>
          <div className="detail-content">
            <span className="detail-label">Program: </span>
            <span className="detail-value">{user?.program || 'Not specified'}</span>
          </div>
        </div>

        <div className="detail-item">
          <i className="bi bi-calendar3"></i>
          <div className="detail-content">
            <span className="detail-label">Semester: </span>
            <span className="detail-value">{user?.semester || 'Not specified'}</span>
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
      {/* Navbar estilo LandingPage */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-gray py-2 fixed-top">
        <div className="container">
          <div className="navbar-brand-container d-flex align-items-center">
            <img src={logo} alt="MIRAI Logo" width="80" height="80" className="navbar-logo" />
            <a className="navbar-brand h1 text_format d-none d-lg-block" href="#" style={{ color: "#fff" }}>
              MIRAI Intelligent Academic Management System
            </a>
            <a className="navbar-brand h1 text_format d-lg-none" href="#" style={{ color: "#fff" }}>
              MIRAI Academic
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
              <li className="nav-item">
                <Link className="nav-link px-3" to="/dashboard">
                  <i className="bi bi-house-door"></i> Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link px-3" to="/profile">
                  <i className="bi bi-person"></i> Profile
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

      {/* Dashboard Layout */}
      <div className="dashboard-layout">
        {/* Overlay para cerrar el sidebar en móvil */}
        <div 
          className={`sidebar-overlay ${showSidebar ? 'show' : ''}`} 
          onClick={closeSidebar}
        ></div>

        {/* Sidebar */}
        <div className={`dashboard-sidebar ${showSidebar ? 'show' : ''}`}>
          <div className="sidebar-header">
            <img src={logo} alt="Logo" className="sidebar-logo" />
            <h3>Control Panel</h3>
          </div>
          
          <div className="sidebar-menu">
            <button 
              className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => handleSectionChange('overview')}
            >
              <i className="bi bi-grid-1x2-fill"></i>
              Overview
            </button>

            {/* Nuevo botón para resultados de entrevista */}
            {status?.interviewCompleted && (
              <button 
                className={`menu-item ${activeSection === 'interview-results' ? 'active' : ''}`}
                onClick={handleInterviewResults}
              >
                <i className="bi bi-chat-dots-fill"></i>
                Interview Results
              </button>
            )}
          </div>

          {/* Botón de cerrar sesión */}
          <button 
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-left"></i>
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
              <>
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
                      <div className="progress-text">Completado</div>
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
                                <i className="bi bi-search"></i> Analyze
                              </Link>
                            )}
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
            </>
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
