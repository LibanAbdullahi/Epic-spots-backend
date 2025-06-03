import express from 'express';
import { prisma } from '../index';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user profile (already handled in auth routes, but keeping for consistency)
router.get('/profile', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            spots: true,
            bookings: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Get owner dashboard data (spots and their bookings)
router.get('/owner/dashboard', authenticateToken, requireRole(['OWNER']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const spots = await prisma.spot.findMany({
      where: { ownerId: req.user!.id },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            dateFrom: 'desc'
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

    // Calculate some basic statistics
    const totalSpots = spots.length;
    const totalBookings = spots.reduce((sum, spot) => sum + spot._count.bookings, 0);
    
    // Calculate upcoming bookings
    const today = new Date();
    const upcomingBookings = spots.flatMap(spot => 
      spot.bookings.filter(booking => booking.dateFrom > today)
    );

    // Calculate total revenue (this is an estimate based on booking dates and spot prices)
    const totalRevenue = spots.reduce((sum, spot) => {
      const spotRevenue = spot.bookings.reduce((spotSum, booking) => {
        const nights = Math.ceil((booking.dateTo.getTime() - booking.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
        return spotSum + (spot.price * nights);
      }, 0);
      return sum + spotRevenue;
    }, 0);

    res.json({
      spots,
      statistics: {
        totalSpots,
        totalBookings,
        upcomingBookings: upcomingBookings.length,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get owner's spots only
router.get('/owner/spots', authenticateToken, requireRole(['OWNER']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const spots = await prisma.spot.findMany({
      where: { ownerId: req.user!.id },
      include: {
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
    console.error('Error fetching owner spots:', error);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

export default router; 