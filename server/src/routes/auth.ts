import express, { Request, Response, Router } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { generateToken, authenticateToken as authMiddleware, AuthRequest } from '../middleware/auth';
import { RegisterInput, LoginCredentials, AuthResponse } from '@note-task-organizer/types';

const router: Router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterInput;

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      email: validatedData.email,
      password: validatedData.password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString(), user.email);

    const response: AuthResponse = {
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    return res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating user',
    });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginCredentials;

    // Find user and include password for comparison
    const user = await User.findOne({ email: validatedData.email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email);

    const response: AuthResponse = {
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error during login',
    });
  }
});

// Get current user (protected route)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: {
        _id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching user',
    });
  }
});

export default router;

