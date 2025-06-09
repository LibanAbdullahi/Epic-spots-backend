import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const owners = [
  {
    name: 'Sarah Mountain Guide',
    email: 'sarah@epicspots.com',
    password: 'password123',
    speciality: 'Mountain camping experiences'
  },
  {
    name: 'Jake Lake Explorer',
    email: 'jake@epicspots.com', 
    password: 'password123',
    speciality: 'Lakeside retreats and water activities'
  },
  {
    name: 'Emma Forest Ranger',
    email: 'emma@epicspots.com',
    password: 'password123',
    speciality: 'Forest hideaways and wildlife encounters'
  }
]

const spots = [
  // Mountain Spots (Sarah's)
  {
    title: 'Alpine Glacier Camp',
    description: 'Wake up to breathtaking glacier views in the heart of the Swiss Alps. This pristine mountain campsite offers unparalleled access to hiking trails and crystal-clear mountain lakes.',
    location: 'Swiss Alps, Switzerland',
    price: 85,
    latitude: 46.5197,
    longitude: 7.9284,
    images: [],
    ownerEmail: 'sarah@epicspots.com'
  },
  {
    title: 'Rocky Mountain Basecamp',
    description: 'Experience the raw beauty of the Canadian Rockies from this elevated campsite. Perfect for stargazing, wildlife watching, and accessing some of the best hiking trails in North America.',
    location: 'Banff National Park, Canada',
    price: 75,
    latitude: 51.4968,
    longitude: -115.9281,
    images: [],
    ownerEmail: 'sarah@epicspots.com'
  },
  {
    title: 'Himalayan Viewpoint Camp',
    description: 'A once-in-a-lifetime camping experience with panoramic views of the Himalayan peaks. This high-altitude site offers incredible sunrise views and access to traditional mountain villages.',
    location: 'Himalayas, Nepal',
    price: 65,
    latitude: 27.9881,
    longitude: 86.9250,
    images: [],
    ownerEmail: 'sarah@epicspots.com'
  },
  {
    title: 'Patagonia Wind Camp',
    description: 'Camp under the dramatic peaks of Patagonia where the wind tells ancient stories. This remote location offers some of the most spectacular mountain scenery on Earth.',
    location: 'Patagonia, Argentina',
    price: 70,
    latitude: -49.2731,
    longitude: -73.0464,
    images: [],
    ownerEmail: 'sarah@epicspots.com'
  },

  // Lake Spots (Jake's)
  {
    title: 'Crystal Lake Retreat',
    description: 'Pristine lakeside camping with crystal-clear waters perfect for swimming, kayaking, and fishing. Wake up to mist rising from the lake and enjoy peaceful mornings by the water.',
    location: 'Lake Tahoe, California',
    price: 95,
    latitude: 39.0968,
    longitude: -120.0324,
    images: [],
    ownerEmail: 'jake@epicspots.com'
  },
  {
    title: 'Northern Lights Lake Camp',
    description: 'Experience the magic of the Northern Lights reflected in pristine lake waters. This remote Finnish Lapland location offers incredible aurora viewing and traditional log cabin amenities.',
    location: 'Finnish Lapland, Finland',
    price: 120,
    latitude: 68.9207,
    longitude: 27.0184,
    images: [],
    ownerEmail: 'jake@epicspots.com'
  },
  {
    title: 'Crater Lake Wilderness',
    description: 'Camp on the rim of one of the deepest lakes in the world. This volcanic wonder offers incredible blue waters and some of the most photographed sunsets in the Pacific Northwest.',
    location: 'Crater Lake, Oregon',
    price: 80,
    latitude: 42.8684,
    longitude: -122.1685,
    images: [],
    ownerEmail: 'jake@epicspots.com'
  },
  {
    title: 'Midnight Sun Lake',
    description: 'Experience the land of the midnight sun beside a serene Arctic lake. During summer months, enjoy 24-hour daylight and pristine wilderness in Norwegian Lapland.',
    location: 'Tromsø, Norway',
    price: 110,
    latitude: 69.6492,
    longitude: 18.9553,
    images: [],
    ownerEmail: 'jake@epicspots.com'
  },

  // Forest Spots (Emma's)  
  {
    title: 'Redwood Cathedral Camp',
    description: 'Sleep among the giants in this cathedral-like grove of ancient redwood trees. These thousand-year-old titans create a mystical atmosphere perfect for digital detox and meditation.',
    location: 'Redwood National Park, California',
    price: 90,
    latitude: 41.2132,
    longitude: -124.0046,
    images: [],
    ownerEmail: 'emma@epicspots.com'
  },
  {
    title: 'Amazon Canopy Camp',
    description: 'Immerse yourself in the world\'s most biodiverse forest. This elevated platform camping experience offers incredible wildlife viewing and the sounds of the rainforest.',
    location: 'Amazon Rainforest, Peru',
    price: 100,
    latitude: -3.4653,
    longitude: -62.2159,
    images: [],
    ownerEmail: 'emma@epicspots.com'
  },
  {
    title: 'Black Forest Hideaway',
    description: 'Experience the fairy-tale atmosphere of Germany\'s Black Forest. This secluded campsite offers access to hiking trails, traditional villages, and the famous cuckoo clock region.',
    location: 'Black Forest, Germany',
    price: 60,
    latitude: 48.1351,
    longitude: 8.3042,
    images: [],
    ownerEmail: 'emma@epicspots.com'
  },
  {
    title: 'Pacific Temperate Rainforest',
    description: 'Camp in one of the world\'s rarest ecosystems - the temperate rainforest. Moss-covered trees, cascading waterfalls, and incredibly lush vegetation create an otherworldly experience.',
    location: 'Olympic National Park, Washington',
    price: 85,
    latitude: 47.8021,
    longitude: -123.6044,
    images: [],
    ownerEmail: 'emma@epicspots.com'
  },

  // Additional spots for variety
  {
    title: 'Desert Oasis Camp',
    description: 'Experience the profound silence of the desert under a canopy of brilliant stars. This oasis campsite offers shade, water, and access to ancient petroglyphs.',
    location: 'Mojave Desert, California',
    price: 55,
    latitude: 34.8691,
    longitude: -116.4286,
    images: [],
    ownerEmail: 'sarah@epicspots.com'
  },
  {
    title: 'Coastal Cliff Camp',
    description: 'Dramatic cliffs meet crashing waves at this spectacular coastal campsite. Watch whales migrate while enjoying some of the most beautiful sunsets on the planet.',
    location: 'Big Sur, California',
    price: 130,
    latitude: 36.2677,
    longitude: -121.8081,
    images: [],
    ownerEmail: 'jake@epicspots.com'
  }
]

async function main() {
  console.log('🌱 Starting to seed camping spots...')

  // Create or update owners
  for (const ownerData of owners) {
    const hashedPassword = await bcrypt.hash(ownerData.password, 10)
    
    await prisma.user.upsert({
      where: { email: ownerData.email },
      update: {},
      create: {
        name: ownerData.name,
        email: ownerData.email,
        password: hashedPassword,
        role: UserRole.OWNER
      }
    })
    console.log(`✅ Created/updated owner: ${ownerData.name}`)
  }

  // Create spots
  for (const spotData of spots) {
    const owner = await prisma.user.findUnique({
      where: { email: spotData.ownerEmail }
    })

    if (!owner) {
      console.error(`❌ Owner not found for email: ${spotData.ownerEmail}`)
      continue
    }

    const spot = await prisma.spot.create({
      data: {
        title: spotData.title,
        description: spotData.description,
        location: spotData.location,
        price: spotData.price,
        latitude: spotData.latitude,
        longitude: spotData.longitude,
        images: spotData.images,
        ownerId: owner.id
      }
    })
    console.log(`🏕️  Created spot: ${spot.title} (${spot.location})`)
  }

  console.log('🎉 Seeding completed successfully!')
  console.log(`📊 Created ${spots.length} camping spots across ${owners.length} owners`)
  console.log('🗺️  All spots include coordinates for map display')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 