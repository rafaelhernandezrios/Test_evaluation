import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/LandingPage.css"; // Archivo de estilos personalizados
import logo from "../assets/logo1.png"; // Imagen del logo
import background from "../assets/ipn3.jpeg"; // Imagen de fondo

const LandingPage = () => {
  useEffect(() => {
    // Asegurarse de que Bootstrap está inicializado correctamente
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-gray py-2 fixed-top">
        <div className="container">
          <div className="navbar-brand-container d-flex align-items-center">
            <img src={logo} alt="MIRAI Logo" width="80" height="80" className="navbar-logo" />
            <a className="navbar-brand h1 text_format d-none d-lg-block" href="#" style={{ color: "#fff" }}>
              Intelligent Academic Management and Evaluation System
            </a>
            <a className="navbar-brand h1 text_format d-lg-none" href="#" style={{ color: "#fff" }}>
              MIRAI Academic
            </a>
          </div>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav" 
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link px-3" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link px-3" to="/register">Register</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section" style={{ backgroundImage: `url(${background})` }}>
        <div className="container text-center text-white purpose-box">
          <h1 className="display-4">Intelligent Academic Report Management</h1>
          <p className="lead">
            Optimize the evaluation and monitoring of reports and assignments in higher education 
            with our AI-powered platform.
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="container my-5">
        <h4 className="text-center mb-4">Main Features</h4>
        <div className="row text-center">
          <div className="col-md-6 col-lg-3 mb-4">
            <i className="bi bi-file-earmark-text icon-feature"></i>
            <h4>Report Management</h4>
            <p>Upload and manage academic reports with ease. Intelligent organization and tracking system.</p>
          </div>
          <div className="col-md-6 col-lg-3 mb-4">
            <i className="bi bi-graph-up icon-feature"></i>
            <h4>Automatic Evaluation</h4>
            <p>Automated report analysis with AI for faster and more objective assessment.</p>
          </div>
          <div className="col-md-6 col-lg-3 mb-4">
            <i className="bi bi-chat-dots icon-feature"></i>
            <h4>Feedback</h4>
            <p>Detailed feedback system to improve academic performance.</p>
          </div>
          <div className="col-md-6 col-lg-3 mb-4">
            <i className="bi bi-clipboard-data icon-feature"></i>
            <h4>Academic Tracking</h4>
            <p>Monitor progress and analyze trends in student performance.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="text-center my-5">
        <Link to="/register" className="btn btn-custom btn-lg">Get Started Now</Link>
      </div>
    </div>
  );
};

export default LandingPage;
