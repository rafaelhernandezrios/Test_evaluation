import express from "express";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises"; // For async operations like fsPromises.mkdir, fsPromises.writeFile
import { fileURLToPath } from "url";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { authMiddleware } from "../routes/authRoutes.js";
import upload from "../middleware/upload.js";
import dotenv from "dotenv";
import User from "../models/User.js";

// Import your utilities from cvUtils
import {
  extractTextFromPdf,
  analyzeCvText,
  generateQuestions,
  evaluateSoftSkills,
  evaluateMultipleIntelligences,
  calculateScore,
  calculateScoreBasedOnAnswers,
} from "../utils/cvUtils.js"; // Adjust the import path as needed

// Load environment variables
dotenv.config();

// Log S3 configuration for debugging
console.log("S3 Configuration:");
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Bucket Name:", process.env.AWS_BUCKET_NAME);
console.log("AWS Access Key ID:", process.env.AWS_ACCESS_KEY_ID ? "Set" : "Not set");
console.log("AWS Secret Access Key:", process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Not set");

const router = express.Router();

// Handy for building absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

//--------------------------------------//
// Upload CV (Protected) to Disk        //
//--------------------------------------//
// Ruta para subir CV
router.post("/upload-cv", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No se recibió el archivo.");
      return res.status(400).json({ message: "No se ha subido ningún archivo" });
    }

    console.log("✅ Archivo recibido:", req.file);

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Save S3 file location
    user.cvPath = req.file.location; // S3 returns the file URL in location
    await user.save();

    return res.status(200).json({
      message: "CV subido correctamente",
      filePath: user.cvPath,
    });
  } catch (error) {
    console.error("❌ Error al subir el archivo:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

//--------------------------------------//
// Get the CV path of the authenticated //
// user (if any)                        //
//--------------------------------------//
router.get("/cv", authMiddleware, async (req, res) => {
  try {
    console.log("CV path request received for user ID:", req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      console.log("User not found with ID:", req.userId);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("User found, CV path:", user.cvPath);
    
    if (!user.cvPath) {
      console.log("No CV path found for user");
      return res.status(404).json({ message: "No CV available" });
    }

    // Return the file path stored in the database
    console.log("Returning CV path:", user.cvPath);
    res.json({ filePath: user.cvPath });
  } catch (error) {
    console.error("Error fetching CV:", error);
    res.status(500).json({ message: "Error fetching CV", error: error.message });
  }
});

//-------------------------//
// Get current user (me)   //
//-------------------------//
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user data including role and cvPath
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Academic Information
      institution: user.institution,
      title: user.title,
      module: user.module,
      programme_code: user.programme_code,
      program: user.program,
      // CV related fields
      cvPath: user.cvPath || "",
      cvAnalyzed: user.cvAnalyzed || false,
      interviewCompleted: user.interviewCompleted || false
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching the user", error });
  }
});

//-----------------------------------------//
// Get user status (CV upload, analysis)   //
//-----------------------------------------//
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      cvUploaded: !!user.cvPath,
      cvAnalyzed: user.cvAnalyzed || false,
      interviewCompleted: user.interviewCompleted || false,
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//----------------------------------------//
// Analyze CV Endpoint                    //
//----------------------------------------//
router.post("/analyze-cv", authMiddleware, async (req, res) => {
  try {
    console.log("Iniciando análisis de CV para el usuario:", req.userId);

    // Instead of findById and save, use findOneAndUpdate
    const user = await User.findById(req.userId);
    if (!user || !user.cvPath) {
      return res.status(404).json({ message: "No CV stored for analysis" });
    }

    const cvText = await extractTextFromPdf(user.cvPath);
    const analysisResult = await analyzeCvText(cvText);
    const allSkills = analysisResult
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const questions = await generateQuestions(allSkills);
    const score = Math.min(allSkills.length * 10, 100);

    // Use findOneAndUpdate instead of save
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          cvText: cvText,
          analysis: analysisResult,
          skills: allSkills,
          questions: questions,
          score: score,
          cvAnalyzed: true
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found during update" });
    }

    console.log("CV analizado con éxito para el usuario:", updatedUser._id);
    res.json({ 
      message: "CV analizado con éxito", 
      userId: updatedUser._id,
      questions,
      score
    });
  } catch (error) {
    console.error("Error procesando CV:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//-------------------------------------------//
// 📌 Guardar respuestas de entrevista en DB //
//-------------------------------------------//
router.post("/submit-interview", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No se enviaron respuestas válidas" });
    }

    // Obtener preguntas del usuario
    const questions = user.questions || [];
    if (questions.length !== answers.length) {
      return res.status(400).json({ message: "Número de respuestas no coincide con las preguntas." });
    }

    // Evaluar respuestas usando GPT
    const { total_score, evaluations } = await calculateScoreBasedOnAnswers(questions, answers);

    // Guardar evaluación en la base de datos del usuario
    user.interviewResponses = answers; // 🆕 Guardamos las respuestas del usuario
    user.interviewScore = total_score;
    user.interviewAnalysis = evaluations;
    user.interviewCompleted = true;

    await user.save();

    return res.json({
      message: "Entrevista evaluada y almacenada con éxito",
      total_score,
      evaluations,
    });

  } catch (error) {
    console.error("Error al procesar la entrevista:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

//-------------------------------------------//
// 📌 Obtener respuestas de entrevista       //
//-------------------------------------------//
router.get("/interview-responses", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.interviewResponses) {
      return res.status(404).json({ message: "No hay respuestas almacenadas." });
    }

    return res.json({
      questions: user.questions,
      responses: user.interviewResponses,
      analysis: user.interviewAnalysis,
      score: user.interviewScore,
    });

  } catch (error) {
    console.error("Error al obtener respuestas de entrevista:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});
router.post("/submit-soft-skills", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const { responses } = req.body;

    if (!responses) {
      return res.status(400).json({ message: "No se enviaron respuestas" });
    }

    // Evaluar las habilidades blandas
    const evaluation = evaluateSoftSkills(responses);

    // Guardar en la base de datos
    user.softSkillsResults = evaluation.results;
    user.score = evaluation.totalScore;
    user.softSkillsSurveyCompleted = true;

    await user.save();

    res.json({
      message: "Encuesta de habilidades blandas guardada exitosamente",
      results: evaluation.results,
      totalScore: evaluation.totalScore,
    });
  } catch (error) {
    console.error("Error al procesar la encuesta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
router.post("/submit-hard-skills", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const { responses } = req.body;

    if (!responses) {
      return res.status(400).json({ message: "No se enviaron respuestas" });
    }

    // Evaluar inteligencias múltiples
    const evaluation = evaluateMultipleIntelligences(responses);

    // Guardar en la base de datos
    user.hardSkillsResults = evaluation.results;
    user.score = evaluation.totalScore;
    user.hardSkillsSurveyCompleted = true;

    await user.save();

    res.json({
      message: "Cuestionario de inteligencias múltiples guardado exitosamente",
      results: evaluation.results,
      totalScore: evaluation.totalScore,
    });
  } catch (error) {
    console.error("Error al procesar el cuestionario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Delete CV route - completely rewritten
router.delete('/delete-cv', authMiddleware, async (req, res) => {
  try {
    console.log("Delete CV request received for user ID:", req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      console.log("User not found with ID:", req.userId);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log("User found, CV path:", user.cvPath);

    // Check if user has a CV path
    if (!user.cvPath) {
      console.log("No CV path found for user");
      return res.status(400).json({ message: "No CV found for this user" });
    }

    // If the file is stored in S3
    if (user.cvPath.includes('amazonaws.com')) {
      try {
        // Extract the key from the S3 URL
        const urlParts = user.cvPath.split('/');
        const key = urlParts[urlParts.length - 1];
        console.log("Attempting to delete S3 file with key:", key);
        console.log("AWS Bucket Name:", process.env.AWS_BUCKET_NAME);

        // Check if bucket name is set
        if (!process.env.AWS_BUCKET_NAME) {
          console.error("AWS_BUCKET_NAME is not set in environment variables");
          // Continue with user document update even if S3 deletion fails
        } else {
          // Delete from S3
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          });

          await s3Client.send(deleteCommand);
          console.log("S3 file deleted successfully");
        }
      } catch (s3Error) {
        console.error("Error deleting file from S3:", s3Error);
        // Continue with user document update even if S3 deletion fails
      }
    } else {
      console.log("CV is not stored in S3, skipping S3 deletion");
    }

    // Update user document
    console.log("Updating user document to remove CV data");
    user.cvPath = "";
    user.cvFile = undefined;
    user.cvText = "";
    user.cvAnalyzed = false;
    user.analysis = "";
    user.skills = [];
    user.questions = [];
    
    await user.save();
    console.log("User document updated successfully");
    
    res.json({ message: "CV deleted successfully" });
  } catch (error) {
    console.error("Error deleting CV:", error);
    res.status(500).json({ message: "Error deleting CV", error: error.message });
  }
});

router.delete('/delete-interview', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    user.interviewResponses = [];
    user.interviewScore = 0;
    user.interviewAnalysis = [];
    user.interviewCompleted = false;
    
    await user.save();
    res.json({ message: "Entrevista eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar entrevista:", error);
    res.status(500).json({ message: "Error al eliminar entrevista" });
  }
});

//-------------------------------------------//
// Get interview questions                    //
//-------------------------------------------//
router.get("/interview-questions", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.questions || user.questions.length === 0) {
      return res.status(404).json({ message: "No questions available" });
    }

    return res.json({
      questions: user.questions
    });

  } catch (error) {
    console.error("Error fetching interview questions:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Delete CV route
router.delete("/delete-cv/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.cvPath) {
      return res.status(400).json({ message: "No CV found for this user" });
    }

    // Extract the key from the S3 URL
    const key = user.cvPath.split('/').pop();

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);

    // Update user document
    user.cvPath = null;
    user.cvAnalyzed = false;
    await user.save();

    res.json({ message: "CV deleted successfully" });
  } catch (error) {
    console.error("Error deleting CV:", error);
    res.status(500).json({ message: "Error deleting CV" });
  }
});

export default router;
