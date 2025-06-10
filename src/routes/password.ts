import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../config/email';

const router = express.Router();

// Change password for authenticated users
router.put('/change', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long' });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user has a password (not OAuth-only)
    if (!user.password) {
      res.status(400).json({ error: 'Cannot change password for OAuth accounts' });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset
router.post('/forgot', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
      return;
    }

    // Check if user has a password (not OAuth-only)
    if (!user.password) {
      res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
      res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset', async (req, res): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify reset token (optional endpoint to check if token is valid)
router.get('/verify-reset-token/:token', async (req, res): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    res.json({ 
      valid: true, 
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
});

export default router; 