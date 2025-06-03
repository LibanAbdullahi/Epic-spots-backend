import express from 'express';
import { prisma } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all spots (public route)
router.get('/', async (req, res): Promise<void> => {
  try {
    const spots = await prisma.spot.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ spots });
  } catch (error) {
    console.error('Error fetching spots:', error);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

// Get single spot by ID
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const spot = await prisma.spot.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        bookings: {
          select: {
            id: true,
            dateFrom: true,
            dateTo: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!spot) {
      res.status(404).json({ error: 'Spot not found' });
      return;
    }

    res.json({ spot });
  } catch (error) {
    console.error('Error fetching spot:', error);
    res.status(500).json({ error: 'Failed to fetch spot' });
  }
});

// Create new spot (owners only)
router.post('/', authenticateToken, requireRole(['OWNER']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { title, description, location, price } = req.body;

    // Validate required fields
    if (!title || !description || !location || !price) {
      res.status(400).json({ error: 'Title, description, location, and price are required' });
      return;
    }

    // Validate price is a positive number
    if (isNaN(price) || price <= 0) {
      res.status(400).json({ error: 'Price must be a positive number' });
      return;
    }

    const spot = await prisma.spot.create({
      data: {
        title,
        description,
        location,
        price: parseFloat(price),
        ownerId: req.user!.id
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Spot created successfully',
      spot
    });
  } catch (error) {
    console.error('Error creating spot:', error);
    res.status(500).json({ error: 'Failed to create spot' });
  }
});

// Update spot (owner only)
router.put('/:id', authenticateToken, requireRole(['OWNER']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, location, price } = req.body;

    // Check if spot exists and belongs to the user
    const existingSpot = await prisma.spot.findUnique({
      where: { id }
    });

    if (!existingSpot) {
      res.status(404).json({ error: 'Spot not found' });
      return;
    }

    if (existingSpot.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only update your own spots' });
      return;
    }

    // Validate price if provided
    if (price && (isNaN(price) || price <= 0)) {
      res.status(400).json({ error: 'Price must be a positive number' });
      return;
    }

    const updatedSpot = await prisma.spot.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(location && { location }),
        ...(price && { price: parseFloat(price) })
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Spot updated successfully',
      spot: updatedSpot
    });
  } catch (error) {
    console.error('Error updating spot:', error);
    res.status(500).json({ error: 'Failed to update spot' });
  }
});

// Delete spot (owner only)
router.delete('/:id', authenticateToken, requireRole(['OWNER']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if spot exists and belongs to the user
    const existingSpot = await prisma.spot.findUnique({
      where: { id }
    });

    if (!existingSpot) {
      res.status(404).json({ error: 'Spot not found' });
      return;
    }

    if (existingSpot.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete your own spots' });
      return;
    }

    await prisma.spot.delete({
      where: { id }
    });

    res.json({ message: 'Spot deleted successfully' });
  } catch (error) {
    console.error('Error deleting spot:', error);
    res.status(500).json({ error: 'Failed to delete spot' });
  }
});

export default router; 