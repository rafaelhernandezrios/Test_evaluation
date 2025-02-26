import fs from "fs/promises";
global.module = { parent: true };  // Simula que el código NO es un script de prueba
import pdf from "pdf-parse";
import OpenAI from "openai";
import dotenv from "dotenv";
import axios from 'axios';
dotenv.config();

// Make sure you set process.env.OPENAI_API_KEY or pass it to new OpenAI({ apiKey: ... }).
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract text from a local PDF file using pdf-parse.
 */
export async function extractTextFromPdf(pdfUrl) {
  try {
    // Download file from S3
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer'
    });
    
    // Convert downloaded file to buffer
    const pdfBuffer = Buffer.from(response.data);
    
    // Parse PDF with pdf-parse
    const data = await pdf(pdfBuffer);
    return data.text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

export const evaluateMultipleIntelligences = (responses) => {
  const intelligences = {
    "Communication Intelligence": [9, 10, 17, 22, 30],
    "Mathematical Intelligence": [5, 7, 15, 20, 25],
    "Visual Intelligence": [1, 11, 14, 23, 27],
    "Kinesthetic Intelligence": [8, 16, 19, 21, 29],
    "Musical Intelligence": [3, 4, 13, 24, 28],
    "Self-Knowledge Intelligence": [2, 6, 26, 31, 33],
    "Social Intelligence": [12, 18, 32, 34, 35],
  };

  const scoreLevels = {
    "Low level": [2, 2],    // 2 true answers
    "Medium level": [3, 3], // 3 true answers
    "High level": [4, 5],   // 4 or more true answers
  };

  let results = {};
  let totalScore = 0;

  for (const [intelligence, questionNumbers] of Object.entries(intelligences)) {
    let countTrue = questionNumbers.filter((qNum) => responses[qNum] === "5").length;
    totalScore += countTrue * 5;

    let level = "Low level";
    for (const [levelName, range] of Object.entries(scoreLevels)) {
      if (countTrue >= range[0] && countTrue <= range[1]) {
        level = levelName;
        break;
      }
    }

    results[intelligence] = { score: countTrue * 5, level };
  }

  return { totalScore, results };
};

export const evaluateSoftSkills = (responses) => {
  const competencies = {
    "Analytical Thinking": [1, 21, 41, 61, 81, 101, 121, 141],
    "Problem Response": [2, 22, 42, 62, 82, 102, 122, 142],
    "Initiative": [3, 23, 43, 63, 83, 103, 123, 143],
    "Self-Control": [4, 24, 44, 64, 84, 104, 124, 144],
    "Stress Management": [5, 25, 45, 65, 85, 105, 125, 145],
    "Socialization": [6, 26, 46, 66, 86, 106, 126, 146],
    "Contribution": [7, 27, 47, 67, 87, 107, 127, 147],
    "Verbal Skills": [8, 28, 48, 68, 88, 108, 128, 148],
    "Moral Principles": [9, 29, 49, 69, 89, 109, 129, 149],
    "Commitment": [10, 30, 50, 70, 90, 110, 130, 150],
  };

  const scoreLevels = {
    "Very low level": [8, 19],
    "Low level": [20, 25],
    "Medium level": [26, 30],
    "High level": [31, 35],
    "Very high level": [36, 40],
  };

  let results = {};
  let totalScore = 0;

  for (const [competency, questionNumbers] of Object.entries(competencies)) {
    let sum = questionNumbers.reduce((acc, qNum) => acc + (responses[qNum] || 1), 0);
    totalScore += sum;

    let level = "Very low level";
    for (const [levelName, range] of Object.entries(scoreLevels)) {
      if (sum >= range[0] && sum <= range[1]) {
        level = levelName;
        break;
      }
    }

    results[competency] = { score: sum, level };
  }

  return { totalScore, results };
};

/**
 * Analyze report text using OpenAI GPT
 */
export async function analyzeCvText(text) {
  try {
    console.log("Sending Report to AI...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert in analyzing academic reports." 
        },
        { 
          role: "user", 
          content: `Analyze the following report and identify key concepts, methodology and main conclusions:\n\n${text}` 
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    if (!response?.choices?.[0]?.message) {
      throw new Error("Unexpected response from OpenAI");
    }

    const extractedText = response.choices[0].message.content.trim();
    console.log("OpenAI Result:", extractedText);
    return extractedText;

  } catch (error) {
    console.error("Error in analyzeCvText:", error);
    return "Error analyzing the report.";
  }
}

/**
 * Analyze assignment report using OpenAI GPT
 */
export async function analyzeAssignmentReport(text, subject, topic) {
  try {
    console.log("Analyzing assignment report...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a university professor expert in evaluating academic assignments." 
        },
        { 
          role: "user", 
          content: `Analyze the following assignment report for the subject "${subject}" about "${topic}". 
                    Identify the main concepts, methodology used, and results obtained:\n\n${text}` 
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    if (!response?.choices?.[0]?.message) {
      throw new Error("Unexpected response from OpenAI");
    }

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error in analyzeAssignmentReport:", error);
    return "Error analyzing the report.";
  }
}

/**
 * Generate questions based on report analysis
 */
export async function generateQuestions(reportAnalysis, subject, topic) {
  const prompt = `
As a professor of "${subject}", generate 10 questions IN ENGLISH to evaluate the assignment about "${topic}", regardless of the language of the original report:
- 5 questions about specific technical content from the report
- 5 questions about the learning process and topic understanding

Report analysis:
${reportAnalysis}

Please respond only in English using the following format:
1. Question about specific content
2. Question about specific content
3. Question about specific content
4. Question about learning process
5. Question about specific content
6. Question about learning process
7. Question about learning process
8. Question about specific content
9. Question about specific content
10. Question about learning process
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });

  let questions = response.choices[0].message.content
    .split("\n")
    .map(q => q.trim())
    .filter(Boolean);

  while (questions.length < 10) {
    questions.push(`${questions.length + 1}. Generic question about the topic.`);
  }

  return questions.slice(0, 10);
}

/**
 * Calculate score based on answers evaluation
 */
export async function calculateScoreBasedOnAnswers(questions, answers, subject) {
  try {
    if (!questions || !answers || questions.length !== answers.length) {
      throw new Error("Number of questions and answers don't match.");
    }

    const prompt = `
As a professor of "${subject}", evaluate the following student answers.
Consider:
- For technical questions: accuracy, correct use of concepts and depth of knowledge
- For process questions: reflection, understanding and analytical capacity

For each answer, provide:
1. A score between 0 and 100
2. Constructive feedback for the student

Questions and answers:
${questions.map((q, i) => `Question: ${q}\nAnswer: ${answers[i]}\n`).join("\n")}

Respond in the following JSON format:
[
  { 
    "score": 85, 
    "feedback": "Good understanding of the concept. Suggestion: explore further..." 
  },
  ...
]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const evaluation = JSON.parse(response.choices[0].message.content);
    const total_score = evaluation.reduce((acc, item) => acc + item.score, 0) / evaluation.length;

    return {
      total_score: Math.round(total_score),
      evaluations: evaluation,
    };

  } catch (error) {
    console.error("Error evaluating answers:", error);
    return {
      total_score: 0,
      evaluations: [],
      error: "Error in answers evaluation",
    };
  }
}

/**
 * Calculate initial score based on assignment analysis
 */
export function calculateScore(reportAnalysis) {
  try {
    // Criterios básicos de evaluación
    const criteria = {
      "Comprensión del tema": 30,
      "Metodología aplicada": 25,
      "Resultados y conclusiones": 25,
      "Claridad y estructura": 20
    };

    let totalScore = 70; // Puntuación base

    // Ajustar score basado en palabras clave en el análisis
    if (reportAnalysis.toLowerCase().includes("metodología")) totalScore += 5;
    if (reportAnalysis.toLowerCase().includes("análisis")) totalScore += 5;
    if (reportAnalysis.toLowerCase().includes("conclusión")) totalScore += 5;
    if (reportAnalysis.toLowerCase().includes("resultados")) totalScore += 5;
    if (reportAnalysis.toLowerCase().includes("referencias")) totalScore += 5;
    if (reportAnalysis.toLowerCase().includes("investigación")) totalScore += 5;

    // Asegurar que el score esté entre 0 y 100
    return Math.min(Math.max(totalScore, 0), 100);
  } catch (error) {
    console.error("Error en calculateScore:", error);
    return 60; // Puntuación por defecto en caso de error
  }
}

