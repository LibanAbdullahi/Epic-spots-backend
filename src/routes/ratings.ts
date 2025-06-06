import express from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get ratings for a specific spot
router.get('/spot/:spotId', async (req, res): Promise<void> => {
  try {
    const { spotId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { spotId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    res.json({ 
      ratings,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Create or update a rating
router.post('/', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { spotId, rating, comment } = req.body;

    // Validate required fields
    if (!spotId || !rating) {
      res.status(400).json({ error: 'Spot ID and rating are required' });
      return;
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    // Check if spot exists
    const spot = await prisma.spot.findUnique({
      where: { id: spotId }
    });

    if (!spot) {
      res.status(404).json({ error: 'Spot not found' });
      return;
    }

    // Check if user is trying to rate their own spot
    if (spot.ownerId === req.user!.id) {
      res.status(400).json({ error: 'You cannot rate your own spot' });
      return;
    }

    // Check if user has already rated this spot
    const existingRating = await prisma.rating.findUnique({
      where: {
        spotId_userId: {
          spotId,
          userId: req.user!.id
        }
      }
    });

    let result;
    if (existingRating) {
      // Update existing rating
      result = await prisma.rating.update({
        where: {
          spotId_userId: {
            spotId,
            userId: req.user!.id
          }
        },
        data: {
          rating,
          comment: comment || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    } else {
      // Create new rating
      result = await prisma.rating.create({
        data: {
          spotId,
          userId: req.user!.id,
          rating,
          comment: comment || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    }

    res.status(existingRating ? 200 : 201).json({
      message: existingRating ? 'Rating updated successfully' : 'Rating created successfully',
      rating: result
    });
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    res.status(500).json({ error: 'Failed to create/update rating' });
  }
});

// Delete a rating
router.delete('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if rating exists and belongs to the user
    const rating = await prisma.rating.findUnique({
      where: { id }
    });

    if (!rating) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }

    if (rating.userId !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete your own ratings' });
      return;
    }

    await prisma.rating.delete({
      where: { id }
    });

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

// Get user's ratings
router.get('/my-ratings', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { userId: req.user!.id },
      include: {
        spot: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ ratings });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ error: 'Failed to fetch user ratings' });
  }
});

export default router; 