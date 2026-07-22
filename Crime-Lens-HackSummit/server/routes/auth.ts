import { Router, Request, Response } from 'express';
import { User, generateToken, verifyToken } from '../auth';
import { mongoDBService } from '../services/mongodb';

const router = Router();

// Middleware to verify JWT token
export const authenticateToken = async (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Initialize MongoDB connection for auth routes
const ensureMongoConnection = async () => {
  if (!mongoDBService.getConnectionStatus()) {
    await mongoDBService.connect();
  }
};

// Sign Up Route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    await ensureMongoConnection();
    const { name, email, password, department, badge } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      department: department || undefined,
      badge: badge || undefined
    });

    await user.save();

    console.log('✅ New user created:', email);

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Return user data (excluding password)
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      badge: user.badge,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userResponse
    });

  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Sign In Route
router.post('/signin', async (req: Request, res: Response) => {
  try {
    await ensureMongoConnection();
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log('✅ User signed in:', email);

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Return user data (excluding password)
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      badge: user.badge,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Sign in successful',
      token,
      user: userResponse
    });

  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    await ensureMongoConnection();
    const userResponse = {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      badge: req.user.badge,
      profileImage: req.user.profileImage,
      isEmailVerified: req.user.isEmailVerified,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt
    };

    res.json({
      message: 'User profile retrieved successfully',
      user: userResponse
    });
  } catch (error: any) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Sign out route
router.post('/signout', authenticateToken, async (req: any, res: Response) => {
  try {
    console.log('✅ User signed out:', req.user.email);
    res.json({
      message: 'Sign out successful'
    });
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// Get all users (for testing - you can remove this later)
router.get('/users', authenticateToken, async (req: any, res: Response) => {
  try {
    await ensureMongoConnection();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.json({
      message: 'Users retrieved successfully',
      count: users.length,
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badge: user.badge,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });
  } catch (error: any) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

export default router;
