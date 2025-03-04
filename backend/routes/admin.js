import express from 'express';
import { authMiddleware } from '../routes/authRoutes.js';
import isAdmin from '../middleware/isAdmin.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, {
      name: 1,
      email: 1,
      institution: 1,
      cvAnalyzed: 1,
      cvPath: 1,
      interviewScore: 1,
      interviewCompleted: 1,
      updatedAt: 1
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Agregar esta ruta al archivo de rutas de administrador
router.post('/make-admin', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User successfully updated to admin' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Get a specific user by ID (admin only)
router.get('/user/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, {
      name: 1,
      email: 1,
      institution: 1,
      cvAnalyzed: 1,
      cvPath: 1,
      interviewScore: 1,
      interviewCompleted: 1,
      updatedAt: 1,
      questions: 1
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Get interview data for a specific user (admin only)
router.get('/interview/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.interviewCompleted) {
      return res.status(400).json({ message: 'User has not completed an interview' });
    }
    
    // Return interview data
    res.json({
      interviewScore: user.interviewScore,
      interviewAnalysis: user.interviewAnalysis,
      interviewResponses: user.interviewResponses,
      completedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error fetching interview data:', error);
    res.status(500).json({ message: 'Error fetching interview data' });
  }
});

export default router; 