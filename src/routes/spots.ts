import express, { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { uploadSpotImages } from '../middleware/upload';

const router = Router();

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
        ratings: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            bookings: true,
            ratings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating for each spot
    const spotsWithRatings = spots.map(spot => {
      const averageRating = spot.ratings.length > 0
        ? spot.ratings.reduce((sum, r) => sum + r.rating, 0) / spot.ratings.length
        : 0;
      
      return {
        ...spot,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: spot._count.ratings,
        ratings: undefined // Remove detailed ratings from list view
      };
    });

    res.json({ spots: spotsWithRatings });
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
        },
        ratings: {
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
        },
        _count: {
          select: {
            ratings: true
          }
        }
      }
    });

    if (!spot) {
      res.status(404).json({ error: 'Spot not found' });
      return;
    }

    // Calculate average rating
    const averageRating = spot.ratings.length > 0
      ? spot.ratings.reduce((sum, r) => sum + r.rating, 0) / spot.ratings.length
      : 0;

    const spotWithRating = {
      ...spot,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: spot._count.ratings
    };

    res.json({ spot: spotWithRating });
  } catch (error) {
    console.error('Error fetching spot:', error);
    res.status(500).json({ error: 'Failed to fetch spot' });
  }
});

// Create new spot (owners only)
router.post('/', authenticateToken, requireRole(['OWNER']), uploadSpotImages, async (req: AuthRequest, res): Promise<void> => {
  try {
    console.log('=== SPOT CREATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Files array:', Array.isArray(req.files) ? req.files : 'Not an array');
    
    const { title, description, location, price, latitude, longitude } = req.body;

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

    // Handle uploaded images
    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      console.log(`Processing ${req.files.length} uploaded files`);
      for (const file of req.files) {
        console.log('File details:', {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        });
        // Store relative path for database
        images.push(`/uploads/${file.filename}`);
      }
    } else {
      console.log('No files uploaded or files not in expected format');
    }

    console.log('Images to save:', images);

    const spot = await prisma.spot.create({
      data: {
        title,
        description,
        location,
        price: parseFloat(price),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images,
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

    console.log('Created spot with images:', spot.images);
    console.log('=== END DEBUG ===');

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
router.put('/:id', authenticateToken, requireRole(['OWNER']), uploadSpotImages, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, location, price, latitude, longitude } = req.body;

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

    // Handle new uploaded images
    const newImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        newImages.push(`/uploads/${file.filename}`);
      }
    }

    // Get existing images and append new ones
    let updatedImages: string[] | undefined;
    if (newImages.length > 0) {
      const currentSpot = await prisma.spot.findUnique({
        where: { id },
        select: { images: true }
      });
      updatedImages = [...(currentSpot?.images || []), ...newImages];
    }

    const updatedSpot = await prisma.spot.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(location && { location }),
        ...(price && { price: parseFloat(price) }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(updatedImages && { images: updatedImages })
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