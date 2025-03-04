import User from '../models/User.js';

const isAdmin = async (req, res, next) => {
  try {
    // Get the user from the database using the userId set by the auth middleware
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    // Add the user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ message: 'Error verifying admin status' });
  }
};

export default isAdmin; 