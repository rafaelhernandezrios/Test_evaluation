import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/InterviewResults.css";
import logo from "../assets/logo1.png";
import 'bootstrap-icons/font/bootstrap-icons.css';
import jsPDF from 'jspdf';

const InterviewResults = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState('questions');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/interview-responses`, {
          headers: { Authorization: token },
        });
        setInterviewData(response.data);
      } catch (err) {
        setError("No se encontraron respuestas de entrevista.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDownload = () => {
    if (!interviewData) return;

    // Create new PDF document
    const doc = new jsPDF();
    let yPos = 20;
    
    // Add title
    doc.setFontSize(16);
    doc.text('RESULTADOS DE LA ENTREVISTA', 20, yPos);
    yPos += 15;

    // Add total score
    doc.setFontSize(14);
    doc.text(`PUNTAJE TOTAL: ${interviewData.score}/100`, 20, yPos);
    yPos += 20;

    // Add analysis section
    doc.setFontSize(14);
    doc.text('ANÁLISIS DETALLADO', 20, yPos);
    yPos += 10;

    // Add each analysis item
    interviewData.analysis.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.text(`Criterio ${index + 1}`, 20, yPos);
      yPos += 7;
      doc.text(`Puntaje: ${item.score}`, 20, yPos);
      yPos += 7;

      // Split long feedback text into multiple lines
      const splitFeedback = doc.splitTextToSize(item.feedback, 170);
      splitFeedback.forEach(line => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      yPos += 10;
    });

    // Save the PDF
    doc.save(`Resultados_Entrevista_${new Date().toLocaleDateString()}.pdf`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading results...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <i className="bi bi-exclamation-circle"></i>
          <p>No interview responses found.</p>
        </div>
      );
    }

    if (!interviewData) return null;

    switch (activeSection) {
      case 'questions':
        return (
          <div className="results-section">
            <h3>
              <i className="bi bi-chat-dots"></i>
              Questions and Answers
            </h3>
            <div className="qa-list">
              {interviewData.questions.map((question, index) => (
                <div key={index} className="qa-card">
                  <div className="question">
                    <span className="q-number">Q{index + 1}</span>
                    <p>{question}</p>
                  </div>
                  <div className="answer">
                    <h5>Your Answer:</h5>
                    <p>{interviewData.responses[index]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="results-section">
            <h3>
              <i className="bi bi-graph-up"></i>
              Detailed Analysis
            </h3>
            <div className="analysis-grid">
              {interviewData.analysis.map((item, index) => (
                <div key={index} className="analysis-card">
                  <div className="analysis-header">
                    <div className="score-badge">
                      {item.score}
                    </div>
                    <h4>Criterion {index + 1}</h4>
                  </div>
                  <p>{item.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-gray py-3 fixed-top">
        <div className="container-fluid">
          <img src={logo} alt="MIRAI Logo" width="150" height="150" />
          <Link className="navbar-brand h1 text_format" to="/dashboard" style={{ color: "#fff" }}>
            MIRAI Intelligent Platform for Academic Evaluation
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/profile">
                  <i className="bi bi-person-circle"></i> Profile
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/resources">
                  <i className="bi bi-book"></i> Resources
                </Link>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link btn btn-link">
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <img src={logo} alt="Logo" className="sidebar-logo" />
            <h3>Results</h3>
          </div>
          
          <div className="sidebar-menu">
            <button 
              className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <i className="bi bi-speedometer2"></i>
              Overview
            </button>
            <button 
              className={`menu-item ${activeSection === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveSection('questions')}
            >
              <i className="bi bi-chat-dots"></i>
              Questions
            </button>
            <button 
              className={`menu-item ${activeSection === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveSection('analysis')}
            >
              <i className="bi bi-graph-up"></i>
              Analysis
            </button>

            <button 
              className="menu-item return-dashboard"
              onClick={() => navigate('/dashboard')}
            >
              <i className="bi bi-arrow-left-circle"></i>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {activeSection === 'overview' ? (
            <div className="results-content">
              <div className="score-card">
                <div className="score-circle" style={{ '--score': `${interviewData?.score || 0}%` }}>
                  <div className="score-value">
                    <h3>{interviewData?.score || 0}</h3>
                    <p>Puntos</p>
                  </div>
                </div>
                <div className="score-label">
                  <h4>Puntaje Total</h4>
                  <p>Basado en tus respuestas y análisis de IA</p>
                </div>
              </div>

              <div className="overview-analysis">
                <h3>
                  <i className="bi bi-graph-up"></i>
                  Resumen del Análisis
                </h3>
                <div className="analysis-grid">
                  {interviewData?.analysis.map((item, index) => (
                    <div key={index} className="analysis-card">
                      <div className="analysis-header">
                        <div className="score-badge" style={{ 
                          backgroundColor: `hsl(${item.score * 1.2}, 70%, 50%)`
                        }}>
                          {item.score}
                        </div>
                        <h4>Criterio {index + 1}</h4>
                      </div>
                      <p>{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="results-actions">
                <button className="btn btn-primary" onClick={handleDownload}>
                  <i className="bi bi-download"></i> Descargar Resultados Completos
                </button>
                <button className="btn btn-outline-primary" onClick={() => navigate("/dashboard")}>
                  Volver al Dashboard
                </button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </>
  );
};

export default InterviewResults;
