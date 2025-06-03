import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.spot.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Pieter Janssen',
        email: 'pieter@example.com',
        password: hashedPassword,
        role: 'USER'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Marie Dubois',
        email: 'marie@example.com',
        password: hashedPassword,
        role: 'OWNER'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Luc Van Der Berg',
        email: 'luc@example.com',
        password: hashedPassword,
        role: 'OWNER'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Sophie Vandenberghe',
        email: 'sophie@example.com',
        password: hashedPassword,
        role: 'USER'
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create spots
  const spots = await Promise.all([
    prisma.spot.create({
      data: {
        title: 'Ardennes Forest Retreat',
        description: 'Rustic camping in the heart of the Belgian Ardennes. Surrounded by dense forests, perfect for hiking and wildlife watching. Close to Dinant and the Meuse River.',
        location: 'Ardennes, Wallonia, Belgium',
        price: 28.00,
        ownerId: users[1].id // Marie Dubois
      }
    }),
    prisma.spot.create({
      data: {
        title: 'North Sea Coastal Camp',
        description: 'Seaside camping experience near the Belgian coast. Perfect for beach lovers and water sports. Walking distance to Oostende and its famous seafood restaurants.',
        location: 'Oostende, West Flanders, Belgium',
        price: 35.00,
        ownerId: users[1].id // Marie Dubois
      }
    }),
    prisma.spot.create({
      data: {
        title: 'Flemish Countryside Haven',
        description: 'Peaceful camping in the rolling hills of Flemish Brabant. Ideal for cycling tours and visiting historic Belgian towns like Leuven and Mechelen.',
        location: 'Flemish Brabant, Flanders, Belgium',
        price: 22.00,
        ownerId: users[2].id // Luc Van Der Berg
      }
    }),
    prisma.spot.create({
      data: {
        title: 'Hoge Kempen Nature Camp',
        description: 'Unique camping experience in Belgium\'s only national park. Excellent for nature photography and exploring the heath landscapes. Near Genk and Maastricht.',
        location: 'Hoge Kempen National Park, Limburg, Belgium',
        price: 30.00,
        ownerId: users[2].id // Luc Van Der Berg
      }
    }),
    prisma.spot.create({
      data: {
        title: 'Durbuy Adventure Base',
        description: 'Camping near Belgium\'s smallest city. Perfect base for outdoor activities like kayaking on the Ourthe River, rock climbing, and exploring medieval Durbuy.',
        location: 'Durbuy, Luxembourg Province, Belgium',
        price: 32.00,
        ownerId: users[1].id // Marie Dubois
      }
    }),
    prisma.spot.create({
      data: {
        title: 'Zwin Nature Reserve Camp',
        description: 'Eco-friendly camping near the Zwin Nature Reserve. Bird watching paradise with views of polders and salt marshes. Close to Knokke-Heist.',
        location: 'Knokke-Heist, West Flanders, Belgium',
        price: 26.00,
        ownerId: users[2].id // Luc Van Der Berg
      }
    }),
    prisma.spot.create({
      data: {
        title: 'Meuse Valley Riverside',
        description: 'Riverside camping along the beautiful Meuse Valley. Great for cycling the RAVeL network and visiting the citadel of Namur. Family-friendly with playgrounds.',
        location: 'Namur, Wallonia, Belgium',
        price: 29.00,
        ownerId: users[1].id // Marie Dubois
      }
    })
  ]);

  console.log(`✅ Created ${spots.length} camping spots`);

  // Create some bookings
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        spotId: spots[0].id,
        userId: users[0].id, // Pieter Janssen
        dateFrom: new Date('2024-06-15'),
        dateTo: new Date('2024-06-18')
      }
    }),
    prisma.booking.create({
      data: {
        spotId: spots[1].id,
        userId: users[3].id, // Sophie Vandenberghe
        dateFrom: new Date('2024-07-01'),
        dateTo: new Date('2024-07-05')
      }
    }),
    prisma.booking.create({
      data: {
        spotId: spots[2].id,
        userId: users[0].id, // Pieter Janssen
        dateFrom: new Date('2024-07-10'),
        dateTo: new Date('2024-07-12')
      }
    }),
    prisma.booking.create({
      data: {
        spotId: spots[3].id,
        userId: users[3].id, // Sophie Vandenberghe
        dateFrom: new Date('2024-08-01'),
        dateTo: new Date('2024-08-03')
      }
    }),
    prisma.booking.create({
      data: {
        spotId: spots[4].id,
        userId: users[0].id, // Pieter Janssen
        dateFrom: new Date('2024-08-15'),
        dateTo: new Date('2024-08-17')
      }
    })
  ]);

  console.log(`✅ Created ${bookings.length} bookings`);

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Test User Accounts:');
  console.log('👤 User: pieter@example.com / password123 (USER)');
  console.log('🏕️  Owner: marie@example.com / password123 (OWNER)');
  console.log('🏕️  Owner: luc@example.com / password123 (OWNER)');
  console.log('👤 User: sophie@example.com / password123 (USER)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 