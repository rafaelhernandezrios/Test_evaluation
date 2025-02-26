import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AnalyzeCV.css"; // Asegúrate de tener este archivo para los estilos
import "../styles/Loading.css"; // Nuevo archivo de estilos para el loading
import logo from "../assets/logo1.png";

const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-gray py-2 fixed-top">
    <div className="container">
      <div className="navbar-brand-container d-flex align-items-center">
        <img src={logo} alt="Logo MIRAI" width="80" height="80" className="navbar-logo" />
        <a className="navbar-brand h1 text_format d-none d-lg-block" href="#" style={{ color: "#fff" }}>
          Intelligent Academic Management and Evaluation System
        </a>
        <a className="navbar-brand h1 text_format d-lg-none" href="#" style={{ color: "#fff" }}>
          MIRAI Academic
        </a>
      </div>
    </div>
  </nav>
);

const AnalyzeCV = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Estado para animación del avatar
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingQuestions = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        // First check if there are existing questions
        const existingQuestionsResponse = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/users/interview-responses`,
          { headers: { Authorization: token } }
        );

        if (existingQuestionsResponse.data.questions?.length > 0) {
          // If questions exist, use them
          const allQuestions = [
            ...existingQuestionsResponse.data.questions,
            "What was your reasoning for answering these questions?"
          ];
          setQuestions(allQuestions);
          setAnswers(new Array(allQuestions.length).fill(""));
          speakQuestion(allQuestions[0]);
          setTimeLeft(180);
          setLoading(false);
        } else {
          // If no questions exist, analyze CV
          await analyzeCV();
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // If no questions found, analyze CV
          await analyzeCV();
        } else {
          console.error("Error checking existing questions:", error);
          setLoading(false);
        }
      }
    };

    const analyzeCV = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/users/analyze-cv`,
          {},
          { headers: { Authorization: token } }
        );

        const { questions: receivedQuestions } = response.data;
        
        if (receivedQuestions && receivedQuestions.length > 0) {
          const allQuestions = [
            ...receivedQuestions,
            "What was your reasoning for answering these questions?"
          ];
          setQuestions(allQuestions);
          setAnswers(new Array(allQuestions.length).fill("")); 
          speakQuestion(allQuestions[0]);
          setTimeLeft(180);
          setLoading(false);
        } else {
          // Keep checking for questions
          const checkInterval = setInterval(async () => {
            try {
              const checkResponse = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/interview-responses`,
                { headers: { Authorization: token } }
              );
              
              if (checkResponse.data.questions?.length > 0) {
                const allQuestions = [
                  ...checkResponse.data.questions,
                  "What was your reasoning for answering these questions?"
                ];
                setQuestions(allQuestions);
                setAnswers(new Array(allQuestions.length).fill("")); 
                speakQuestion(allQuestions[0]);
                setTimeLeft(180);
                setLoading(false);
                clearInterval(checkInterval);
              }
            } catch (error) {
              console.error("Error checking questions:", error);
            }
          }, 5000);

          // Clear interval after 2 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            setLoading(false);
          }, 120000);
        }
      } catch (error) {
        console.error("Error analyzing CV:", error);
        setLoading(false);
      }
    };

    checkExistingQuestions();
  }, []);

  // Add timer effect
  useEffect(() => {
    let timer;
    if (questions.length > 0 && timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 180; // Reset to 3 minutes
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [timeLeft, questions, submitted]);

  // 🔊 Hablar y animar avatar
  const speakQuestion = (question) => {
    if ("speechSynthesis" in window) {
      // Cancel any previous audio
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = "en-US";

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsAudioPlaying(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsAudioPlaying(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsAudioPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.error("Your browser doesn't support Web Speech API");
    }
  };

  const handleAnswerChange = (event) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = event.target.value;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1 && !isAudioPlaying) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(180); // Reset timer
      speakQuestion(questions[nextIndex]);
    } else if (!isAudioPlaying) {
      // Asegurarse de que todas las respuestas estén completas antes de enviar
      if (answers.some(answer => !answer.trim())) {
        alert("Please answer all questions before submitting");
        return;
      }
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0 && !isAudioPlaying) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      speakQuestion(questions[prevIndex]);
    }
  };

  const handleBackToDashboard = () => {
    // Stop any playing audio
    window.speechSynthesis.cancel();
    if (window.confirm('Are you sure you want to return to dashboard? Your answers will be lost.')) {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    // Formatear las respuestas como un objeto estructurado
    const formattedAnswers = answers.map((answer, index) => ({
      question: questions[index],
      answer: answer.trim()
    }));

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/submit-interview`,
        {
          interviewResponses: formattedAnswers,
          completed: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Asegurarse de incluir 'Bearer'
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setSubmitted(true);
        window.speechSynthesis.cancel();
        setTimeout(() => navigate("/interview-results"), 2000);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);
      alert(error.response?.data?.message || "Error submitting answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Agregar esta función para prevenir pegar
  const handlePaste = (e) => {
    e.preventDefault();
    alert("Pasting text is not allowed in the answers");
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <img src={logo} alt="Logo" className="sidebar-logo" />
            <h3>AI Interview</h3>
          </div>
          
          <div className="sidebar-menu">
            <div className="interview-progress">
              <div className="progress-info">
                <span>Progress</span>
                <span>{currentQuestionIndex + 1}/{questions.length}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button 
            className="menu-item return-dashboard"
            onClick={handleBackToDashboard}
          >
            <i className="bi bi-arrow-left-circle"></i>
            Back to Dashboard
          </button>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {loading ? (
            <div className="loading-container">
              <div className="modern-loading-animation">
                <div className="pulse-ring"></div>
                <div className="pulse-core">
                  <i className="bi bi-file-text"></i>
                </div>
              </div>
              <p className="loading-text">Analyzing your report...</p>
            </div>
          ) : submitted ? (
            <div className="success-container">
              <div className="success-animation">
                <i className="bi bi-check-circle"></i>
              </div>
              <p>Answers submitted successfully</p>
              <p className="redirect-text">Redirecting to results...</p>
            </div>
          ) : (
            <div className="interview-container">
              <div className="ai-assistant">
                <div className={`ai-avatar ${isSpeaking ? "speaking" : ""}`}>
                  <div className="avatar-rings">
                    <div className="ring"></div>
                    <div className="ring"></div>
                    <div className="ring"></div>
                  </div>
                  <div className="avatar-core" />
                </div>
                {isSpeaking && (
                  <div className="sound-waves">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                  </div>
                )}
              </div>

              {questions.length > 0 ? (
                <div className="question-section">
                  <div className="question-card">
                    <div className="timer">
                      Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <span className="question-number">Question {currentQuestionIndex + 1}</span>
                    <p className="question-text">{questions[currentQuestionIndex]}</p>
                    <div className="answer-section">
                      <textarea
                        className="answer-input"
                        value={answers[currentQuestionIndex] || ""}
                        onChange={handleAnswerChange}
                        onPaste={handlePaste}
                        placeholder="Write your answer here..."
                        rows="4"
                      />
                    </div>
                  </div>

                  <div className="navigation-controls">
                    <button 
                      onClick={handlePreviousQuestion} 
                      className="nav-button prev"
                      disabled={currentQuestionIndex === 0 || isAudioPlaying}
                    >
                      <i className="bi bi-arrow-left"></i>
                      Previous
                    </button>

                    <button 
                      onClick={handleNextQuestion} 
                      className="nav-button next"
                      disabled={isAudioPlaying}
                    >
                      {currentQuestionIndex < questions.length - 1 ? (
                        <>Next <i className="bi bi-arrow-right"></i></>
                      ) : (
                        <>Finish <i className="bi bi-check-circle"></i></>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-questions">
                  <i className="bi bi-exclamation-circle"></i>
                  <p>Please wait while we analyze your CV and generate questions...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AnalyzeCV;
