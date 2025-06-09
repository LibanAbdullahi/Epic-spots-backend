# Epic Spots - Backend Server

A robust Node.js API server for the Epic Spots camping booking platform, providing secure authentication, booking management, and comprehensive camping spot data.

## 🏕️ Overview

The Epic Spots backend is built with Node.js, Express, and PostgreSQL with Prisma ORM, providing a RESTful API that powers the camping booking platform. It handles user authentication, spot management, booking processing, and data persistence with a focus on security and performance.

## ✨ Features

### Core Functionality
- **User Authentication**: JWT-based authentication with role management
- **Spot Management**: CRUD operations for camping spots
- **Booking System**: Complete booking lifecycle management
- **User Profiles**: User account management and preferences
- **Review System**: Ratings and reviews for camping spots
- **File Upload**: Image upload and management for spots
- **Search & Filtering**: Advanced search with multiple filters

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: Additional security headers
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

### Database Features
- **Prisma ORM**: Type-safe database access with Prisma
- **PostgreSQL**: Robust relational database
- **Migrations**: Database schema versioning
- **Type Safety**: Full TypeScript integration

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **File Upload**: Multer
- **Environment**: dotenv
- **CORS**: cors middleware
- **Security**: Helmet
- **Dev Tools**: tsx, nodemon

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/epic-spots.git
   cd epic-spots/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure the following:
   ```bash
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/epicspots"
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   
   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5000000
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database (optional)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Test the API**
   Navigate to `http://localhost:3001/api/health`

## 📝 Available Scripts

- `npm run dev` - Start development server with nodemon and tsx
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with Prisma seed script
- `npm run prisma:reset` - Reset database and run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed database with custom spots data

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/       # Route controllers
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── spotController.ts
│   │   ├── bookingController.ts
│   │   └── reviewController.ts
│   ├── middleware/        # Custom middleware
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── upload.ts     # File upload middleware
│   │   └── errorHandler.ts
│   ├── routes/           # Express routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── spots.ts
│   │   ├── bookings.ts
│   │   └── reviews.ts
│   ├── utils/            # Utility functions
│   │   ├── jwt.ts
│   │   └── validation.ts
│   ├── scripts/          # Database scripts
│   │   └── seedSpots.ts
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Server entry point
├── prisma/               # Prisma configuration
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts          # Database seed script
├── uploads/              # File upload directory
├── dist/                 # Built JavaScript files
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # User login
POST   /api/auth/logout       # User logout
GET    /api/auth/me           # Get current user
PUT    /api/auth/profile      # Update user profile
PUT    /api/auth/password     # Change password
```

### Spots
```
GET    /api/spots             # Get all spots (with filters)
GET    /api/spots/:id         # Get spot by ID
POST   /api/spots             # Create new spot (owner only)
PUT    /api/spots/:id         # Update spot (owner only)
DELETE /api/spots/:id         # Delete spot (owner only)
POST   /api/spots/:id/images  # Upload spot images
```

### Bookings
```
GET    /api/bookings          # Get user bookings
GET    /api/bookings/:id      # Get booking by ID
POST   /api/bookings          # Create new booking
PUT    /api/bookings/:id      # Update booking
DELETE /api/bookings/:id      # Cancel booking
```

### Reviews
```
GET    /api/reviews/:spotId   # Get reviews for a spot
POST   /api/reviews           # Create new review
PUT    /api/reviews/:id       # Update review (author only)
DELETE /api/reviews/:id       # Delete review (author only)
```

## 🗄️ Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User**: User accounts with authentication and profile data
- **Spot**: Camping spots with location, pricing, and amenities
- **Booking**: Reservations linking users to spots with dates
- **Review**: User reviews and ratings for spots
- **Images**: File metadata for uploaded images

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```bash
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔧 Development

### Database Management
```bash
# View database in Prisma Studio
npm run prisma:studio

# Reset database (development only)
npm run prisma:reset

# Generate new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy
```

### Adding New Features
1. Update Prisma schema if needed
2. Generate migration
3. Update TypeScript types
4. Add API endpoints
5. Test thoroughly

## 📊 Performance

- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Security Headers**: Helmet.js for security headers
- **File Upload Limits**: Configurable upload size limits
- **Type Safety**: Full TypeScript coverage for better reliability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the logs: `tail -f combined.log`
2. Verify environment variables
3. Check database connectivity
4. Review the API documentation
5. Create an issue on GitHub

---

Built with ❤️ for camping enthusiasts everywhere! 🏕️ 