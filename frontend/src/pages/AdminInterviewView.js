import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import logo from '../assets/logo1.png';
import '../styles/AdminDashboard.css';

const AdminInterviewView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [interviewData, setInterviewData] = useState(null);

  // Define fetchInterviewData outside useEffect so it can be reused
  const fetchInterviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Fetch user data
      const userResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/user/${userId}`,
        { headers: { Authorization: token } }
      );
      
      setUser(userResponse.data);
      
      // Fetch interview data
      const interviewResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/interview/${userId}`,
        { headers: { Authorization: token } }
      );
      
      console.log('Interview data:', interviewResponse.data);
      console.log('User data:', userResponse.data);
      setInterviewData(interviewResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interview data:', error);
      setError('Failed to load interview data. Please try again.');
      setLoading(false);
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchInterviewData();
  }, [userId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="MIRAI Logo" className="sidebar-logo" />
          <h4>MIRAI Admin</h4>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/admin" className="menu-item">
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </Link>
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

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Top Navigation */}
        <div className="admin-top-nav">
          <div className="admin-nav-left">
            <h2>Interview Analysis</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link to="/admin">Dashboard</Link></li>
                <li className="breadcrumb-item active" aria-current="page">Interview Analysis</li>
              </ol>
            </nav>
          </div>
          
          <div className="admin-nav-right">
            <div className="admin-profile">
              <span>Admin</span>
              <div className="admin-avatar">A</div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading interview data...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="bi bi-exclamation-triangle"></i>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={fetchInterviewData}>Try Again</button>
              <button className="btn btn-secondary ms-2" onClick={() => navigate('/admin')}>Back to Dashboard</button>
            </div>
          ) : (
            <>
              {/* User Info Card */}
              <div className="user-info-card">
                <div className="user-info-header">
                  <div className="user-details">
                    <h3>{user?.name}</h3>
                    <p>{user?.email}</p>
                    <p><strong>Institution:</strong> {user?.institution}</p>
                  </div>
                </div>
                <div className="user-info-stats">
                  <div className="stat-item">
                    <span className="stat-label">Interview Score</span>
                    <span className="stat-value">{interviewData?.interviewScore}/100</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completed On</span>
                    <span className="stat-value">
                      {new Date(interviewData?.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user?.cvPath && (
                    <div className="stat-item">
                      <span className="stat-label">CV</span>
                      <a 
                        href={user.cvPath} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-sm btn-info"
                      >
                        <i className="bi bi-file-pdf"></i> View CV
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Interview Analysis */}
              <div className="interview-analysis-section">
                <h3>Interview Analysis</h3>
                
                {interviewData?.interviewAnalysis?.length > 0 ? (
                  <div className="analysis-grid">
                    {interviewData.interviewAnalysis.map((item, index) => {
                      // Depuración
                      console.log(`Item ${index}:`, item);
                      console.log(`User questions:`, user?.questions);
                      console.log(`Interview responses:`, interviewData?.interviewResponses);
                      
                      // Intentar obtener la pregunta correspondiente
                      let questionText = 'No question data available';
                      if (item.question) {
                        questionText = item.question;
                      } else if (user?.questions && Array.isArray(user.questions) && user.questions[index]) {
                        questionText = user.questions[index];
                      }
                      
                      // Intentar obtener la respuesta correspondiente
                      let answerText = 'No answer data available';
                      if (item.answer) {
                        answerText = item.answer;
                      } else if (interviewData?.interviewResponses && Array.isArray(interviewData.interviewResponses) && interviewData.interviewResponses[index]) {
                        // Las respuestas pueden ser objetos con una propiedad 'answer'
                        const response = interviewData.interviewResponses[index];
                        if (typeof response === 'object' && response !== null && response.answer) {
                          answerText = response.answer;
                        } else {
                          answerText = response;
                        }
                      }
                      
                      return (
                        <div key={index} className="analysis-card">
                          <div className="analysis-header">
                            <div className="score-badge">
                              {item.score}
                            </div>
                            <h4>Question {index + 1}</h4>
                          </div>
                          <div className="question-container">
                            <h5 className="question-label">Question:</h5>
                            <div className="question-text">
                              {typeof questionText === 'string' 
                                ? questionText 
                                : typeof questionText === 'object' && questionText !== null
                                  ? JSON.stringify(questionText, null, 2)
                                  : 'No question data available'}
                            </div>
                          </div>
                          <div className="answer-container">
                            <h5 className="answer-label">Answer:</h5>
                            <div className="answer-text">
                              {typeof answerText === 'string' 
                                ? answerText 
                                : typeof answerText === 'object' && answerText !== null
                                  ? JSON.stringify(answerText, null, 2)
                                  : 'No answer data available'}
                            </div>
                          </div>
                          <div className="feedback-section">
                            <h5>Feedback</h5>
                            <p>{item.feedback}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <i className="bi bi-info-circle"></i>
                    <p>No interview analysis data available</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInterviewView; 