import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Register.css"; // Asegúrate de que la ruta sea correcta
import logo from "../assets/logo1.png"; // Imagen del logo

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    institution: "",
    title: "",
    module: "",
    programme_code: "",
    program: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) strength += 1;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
      setPasswordMatch(value === form.confirmPassword);
    }
    if (name === 'confirmPassword') {
      setPasswordMatch(value === form.password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    
    if (!form.email.includes("@")) {
      setError("Por favor, introduce un email válido.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/register`, form);
      setMessage("Usuario registrado con éxito. Redirigiendo...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Error en el registro. Intenta de nuevo.");
    }
  };

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
              MIRAI Intelligent Platform
            </a>
            <a className="navbar-brand h1 text_format d-lg-none" href="#" style={{ color: "#fff" }}>
              MIRAI
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
                <Link className="nav-link px-3" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link px-3" to="/login">Login</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="register-container">
        <div className="register-card">
          <h2 className="register-title">Register</h2>
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <h4 className="section-title">Personal Information</h4>
            <div className="mb-3">
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Full Name"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Email"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Password (minimum 6 characters)"
                onChange={handleChange}
                required
                minLength="6"
              />
              <div className="password-strength-meter mt-2">
                <div className="strength-bars">
                  <div className={`strength-bar ${passwordStrength >= 1 ? 'active' : ''}`}></div>
                  <div className={`strength-bar ${passwordStrength >= 2 ? 'active' : ''}`}></div>
                  <div className={`strength-bar ${passwordStrength >= 3 ? 'active' : ''}`}></div>
                  <div className={`strength-bar ${passwordStrength >= 4 ? 'active' : ''}`}></div>
                </div>
                <small className="strength-text">
                  {passwordStrength === 0 && "Very weak"}
                  {passwordStrength === 1 && "Weak"}
                  {passwordStrength === 2 && "Medium"}
                  {passwordStrength === 3 && "Strong"}
                  {passwordStrength === 4 && "Very strong"}
                </small>
              </div>
            </div>
            <div className="mb-3">
              <input
                type="password"
                name="confirmPassword"
                className={`form-control ${form.confirmPassword ? (passwordMatch ? 'is-valid' : 'is-invalid') : ''}`}
                placeholder="Confirm password"
                onChange={handleChange}
                required
                minLength="6"
              />
              {form.confirmPassword && !passwordMatch && (
                <div className="invalid-feedback">
                  Passwords do not match
                </div>
              )}
            </div>
            <div className="mb-3">
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="Phone"
                onChange={handleChange}
                required
              />
            </div>

            {/* Academic Information */}
            <h4 className="section-title">Academic Information</h4>
            <div className="mb-3">
              <input
                type="text"
                name="institution"
                className="form-control"
                placeholder="Institution"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="Academic Title"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                name="module"
                className="form-control"
                placeholder="Module"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                name="programme_code"
                className="form-control"
                placeholder="Programme Code"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                name="program"
                className="form-control"
                placeholder="Program or Major"
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-register w-100">
              Register
            </button>
          </form>
          {message && <p className="register-message">{message}</p>}

          <div className="register-footer">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
