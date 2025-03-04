import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/AdminDashboard.css";
import logo from "../assets/logo1.png";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/users`,
        {
          headers: { Authorization: token },
        }
      );
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError("You don't have permission to access this page");
      setLoading(false);
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Filter users based on search term and filter status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.institution.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "analyzed") return matchesSearch && user.cvAnalyzed;
    if (filterStatus === "pending") return matchesSearch && !user.cvAnalyzed;
    if (filterStatus === "interviewed") return matchesSearch && user.interviewCompleted;
    
    return matchesSearch;
  });

  // Calculate statistics
  const totalUsers = users.length;
  const analyzedCVs = users.filter(user => user.cvAnalyzed).length;
  const completedInterviews = users.filter(user => user.interviewCompleted).length;
  const averageScore = users.filter(user => user.interviewCompleted).reduce((acc, user) => acc + user.interviewScore, 0) / 
                     (completedInterviews || 1);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="MIRAI Logo" className="sidebar-logo" />
        </div>
        
        <div className="sidebar-menu">
          <div className="menu-item active">
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </div>
          <Link to="/dashboard" className="menu-item">
            <i className="bi bi-house-door"></i>
            <span>Main Dashboard</span>
          </Link>
          <div className="menu-item" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-gray py-3 mb-4">
          <div className="container-fluid">
            <button 
              className="btn btn-dark d-lg-none me-3"
              onClick={toggleSidebar}
              style={{ fontSize: '20px' }}
            >
              <i className="bi bi-list"></i>
            </button>

            <div className="d-flex align-items-center">
              <a className="navbar-brand h1 text_format" href="#" style={{ color: "#fff", fontSize: '20px' }}>
                Admin Dashboard
              </a>
            </div>

            <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="#">
                    Dashboard
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#" onClick={handleLogout}>
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading user data...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="bi bi-exclamation-triangle"></i>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={fetchUsers}>Try Again</button>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-card-icon blue">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div className="stat-card-info">
                    <h3>{totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-card-icon green">
                    <i className="bi bi-file-earmark-check"></i>
                  </div>
                  <div className="stat-card-info">
                    <h3>{analyzedCVs}</h3>
                    <p>Analyzed CVs</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-card-icon purple">
                    <i className="bi bi-chat-dots"></i>
                  </div>
                  <div className="stat-card-info">
                    <h3>{completedInterviews}</h3>
                    <p>Completed Interviews</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-card-icon orange">
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <div className="stat-card-info">
                    <h3>{averageScore.toFixed(1)}</h3>
                    <p>Avg. Interview Score</p>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="users-table-section">
                <div className="table-header">
                  <h3>User Overview</h3>
                  <div className="table-actions">
                    <div className="search-box">
                      <i className="bi bi-search"></i>
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="filter-dropdown">
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="form-select"
                      >
                        <option value="all">All Users</option>
                        <option value="analyzed">CV Analyzed</option>
                        <option value="pending">CV Pending</option>
                        <option value="interviewed">Interviewed</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Institution</th>
                        <th>Report Status</th>
                        <th>Interview Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            No users found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user._id}>
                            <td>
                              <div className="user-info">
                                <div className="user-avatar">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h6>{user.name}</h6>
                                  <small>{user.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>{user.institution}</td>
                            <td>
                              <span className={`status-badge ${user.cvAnalyzed ? 'completed' : 'pending'}`}>
                                {user.cvAnalyzed ? 'Analyzed' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              {user.interviewCompleted ? (
                                <div className="progress-container">
                                  <div className="progress">
                                    <div 
                                      className="progress-bar" 
                                      style={{ width: `${user.interviewScore}%` }}
                                    ></div>
                                  </div>
                                  <span className="score">{user.interviewScore}/100</span>
                                </div>
                              ) : (
                                <span className="pending">Not completed</span>
                              )}
                            </td>
                            <td>
                              <div className="action-buttons">
                                {user.cvPath && (
                                  <a 
                                    href={user.cvPath} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-sm btn-info"
                                    title="View CV"
                                  >
                                    <i className="bi bi-file-pdf"></i>
                                  </a>
                                )}
                                {user.interviewCompleted && (
                                  <Link 
                                    to={`/admin/interview/${user._id}`} 
                                    className="btn btn-sm btn-primary"
                                    title="View Interview Analysis"
                                  >
                                    <i className="bi bi-chat-dots"></i>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 