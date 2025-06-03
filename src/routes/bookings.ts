import express from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: {
        spot: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        dateFrom: 'desc'
      }
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create new booking
router.post('/', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { spotId, dateFrom, dateTo } = req.body;

    // Validate required fields
    if (!spotId || !dateFrom || !dateTo) {
      res.status(400).json({ error: 'Spot ID, dateFrom, and dateTo are required' });
      return;
    }

    // Validate dates
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      res.status(400).json({ error: 'Booking date cannot be in the past' });
      return;
    }

    if (fromDate >= toDate) {
      res.status(400).json({ error: 'Check-out date must be after check-in date' });
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

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        spotId,
        OR: [
          {
            AND: [
              { dateFrom: { lte: fromDate } },
              { dateTo: { gt: fromDate } }
            ]
          },
          {
            AND: [
              { dateFrom: { lt: toDate } },
              { dateTo: { gte: toDate } }
            ]
          },
          {
            AND: [
              { dateFrom: { gte: fromDate } },
              { dateTo: { lte: toDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBooking) {
      res.status(409).json({ 
        error: 'Spot is already booked for the selected dates' 
      });
      return;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        spotId,
        userId: req.user!.id,
        dateFrom: fromDate,
        dateTo: toDate
      },
      include: {
        spot: {
          select: {
            title: true,
            location: true,
            price: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Cancel booking
router.delete('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if booking exists and belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        spot: true
      }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.userId !== req.user!.id) {
      res.status(403).json({ error: 'You can only cancel your own bookings' });
      return;
    }

    // Check if booking can be cancelled (at least 24 hours before check-in)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (booking.dateFrom <= tomorrow) {
      res.status(400).json({ 
        error: 'Bookings can only be cancelled at least 24 hours before check-in' 
      });
      return;
    }

    await prisma.booking.delete({
      where: { id }
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        spot: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            price: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Only allow users to see their own bookings or spot owners to see bookings for their spots
    if (booking.userId !== req.user!.id && booking.spot.owner.email !== req.user!.email) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

export default router; 