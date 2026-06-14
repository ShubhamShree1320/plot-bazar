import "dotenv/config";
import { PrismaClient, Role, PlotStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

async function main() {
  console.log("🌱 Seeding database...");

  // Create settings
  await prisma.settings.upsert({
    where: { id: "global" },
    create: { id: "global", freeListingLimit: 3, listingFeeAmount: 200, otpExpiryMinutes: 10, feedbackDelayHours: 48 },
    update: {},
  });

  // ── Demo accounts (easy login in dev) ──────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "demo.admin@plotbazaar.in" },
    create: {
      name: "Demo Admin",
      email: "demo.admin@plotbazaar.in",
      role: Role.ADMIN,
      isVerified: true,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "demo.buyer@plotbazaar.in" },
    create: {
      name: "Demo Buyer",
      email: "demo.buyer@plotbazaar.in",
      role: Role.USER,
      isVerified: true,
    },
    update: {},
  });

  // ── Seeded admin users ──────────────────────────────────────────────────────
  const admin1 = await prisma.user.upsert({
    where: { email: "admin@plotbazaar.in" },
    create: {
      name: "Admin User",
      email: "admin@plotbazaar.in",
      role: Role.ADMIN,
      isVerified: true,
      freeListingsUsed: 0,
    },
    update: {},
  });

  const admin2 = await prisma.user.upsert({
    where: { email: "superadmin@plotbazaar.in" },
    create: {
      name: "Super Admin",
      email: "superadmin@plotbazaar.in",
      role: Role.ADMIN,
      isVerified: true,
    },
    update: {},
  });

  // Create regular users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "seller1@example.com" },
      create: { name: "Rajesh Kumar", email: "seller1@example.com", phone: "+919876543210", isVerified: true },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "seller2@example.com" },
      create: { name: "Priya Sharma", email: "seller2@example.com", phone: "+919876543211", isVerified: true },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "seller3@example.com" },
      create: { name: "Amit Patel", email: "seller3@example.com", phone: "+919876543212", isVerified: true },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "buyer1@example.com" },
      create: { name: "Suresh Reddy", email: "buyer1@example.com", phone: "+919876543213", isVerified: true },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "buyer2@example.com" },
      create: { name: "Meena Iyer", email: "buyer2@example.com", phone: "+919876543214", isVerified: true },
      update: {},
    }),
  ]);

  console.log(`✅ Created ${users.length + 2} users`);

  // Sample plots data
  const plotsData = [
    {
      title: "Prime Residential Plot in Whitefield, Bengaluru",
      description: "Well-developed residential plot in the heart of Whitefield. Close to IT corridors, schools, hospitals, and malls. East-facing, corner plot.",
      price: 6500000,
      area: 2400,
      areaUnit: "sqft",
      state: "Karnataka",
      city: "Bengaluru",
      locality: "Whitefield",
      pincode: "560066",
      latitude: 12.9698,
      longitude: 77.7500,
      status: PlotStatus.ACTIVE,
      tokenAmount: 5000,
      sellerId: users[0].id,
    },
    {
      title: "Agricultural Land for Sale in Nashik District",
      description: "Fertile agricultural land with water source nearby. Suitable for grape cultivation, known as Wine Capital of India.",
      price: 2500000,
      area: 1,
      areaUnit: "acre",
      state: "Maharashtra",
      city: "Nashik",
      locality: "Gangapur Road",
      pincode: "422005",
      latitude: 19.9975,
      longitude: 73.7898,
      status: PlotStatus.ACTIVE,
      tokenAmount: 2000,
      sellerId: users[1].id,
    },
    {
      title: "Commercial Plot in Hitech City, Hyderabad",
      description: "Strategic commercial plot near Hitech City IT hub. High growth corridor with excellent connectivity.",
      price: 12000000,
      area: 1800,
      areaUnit: "sqft",
      state: "Telangana",
      city: "Hyderabad",
      locality: "Madhapur",
      pincode: "500081",
      latitude: 17.4485,
      longitude: 78.3908,
      status: PlotStatus.ACTIVE,
      tokenAmount: 10000,
      sellerId: users[2].id,
    },
    {
      title: "Residential Plot in Anna Nagar, Chennai",
      description: "Premium residential plot in upscale Anna Nagar. Wide road access, all amenities nearby.",
      price: 8500000,
      area: 2400,
      areaUnit: "sqft",
      state: "Tamil Nadu",
      city: "Chennai",
      locality: "Anna Nagar",
      pincode: "600040",
      latitude: 13.0843,
      longitude: 80.2098,
      status: PlotStatus.ACTIVE,
      tokenAmount: 7000,
      sellerId: users[0].id,
    },
    {
      title: "Plot near Dwarka Expressway, Gurugram",
      description: "Excellent investment opportunity. Located along the rapidly developing Dwarka Expressway with metro connectivity.",
      price: 9000000,
      area: 200,
      areaUnit: "sqyd",
      state: "Haryana",
      city: "Gurugram",
      locality: "Sector 99",
      pincode: "122505",
      latitude: 28.5004,
      longitude: 76.9800,
      status: PlotStatus.ACTIVE,
      tokenAmount: 8000,
      sellerId: users[1].id,
    },
    {
      title: "Industrial Plot in Pune MIDC",
      description: "Government approved industrial plot in established MIDC area. All utilities available.",
      price: 15000000,
      area: 5000,
      areaUnit: "sqft",
      state: "Maharashtra",
      city: "Pune",
      locality: "Chakan MIDC",
      pincode: "410501",
      latitude: 18.7644,
      longitude: 73.8567,
      status: PlotStatus.PENDING,
      tokenAmount: null,
      sellerId: users[2].id,
    },
    {
      title: "Beach-facing Plot in Alibaug",
      description: "Rare beach-facing residential plot with panoramic sea views. Ideal for premium villa or resort development.",
      price: 18000000,
      area: 3600,
      areaUnit: "sqft",
      state: "Maharashtra",
      city: "Alibaug",
      locality: "Kihim Beach",
      pincode: "402201",
      latitude: 18.6529,
      longitude: 72.8734,
      status: PlotStatus.ACTIVE,
      tokenAmount: 15000,
      sellerId: users[0].id,
    },
    {
      title: "Budget Plot in Devanahalli, Bengaluru",
      description: "Affordable residential plot near Kempegowda International Airport. Rapidly appreciating area.",
      price: 1800000,
      area: 1200,
      areaUnit: "sqft",
      state: "Karnataka",
      city: "Bengaluru",
      locality: "Devanahalli",
      pincode: "562110",
      latitude: 13.2449,
      longitude: 77.7143,
      status: PlotStatus.ACTIVE,
      tokenAmount: 1500,
      sellerId: users[1].id,
    },
    {
      title: "Corner Plot in Jaipur Pink City",
      description: "Prime corner plot in Vaishali Nagar. Premium locality with all modern amenities.",
      price: 4500000,
      area: 300,
      areaUnit: "sqyd",
      state: "Rajasthan",
      city: "Jaipur",
      locality: "Vaishali Nagar",
      pincode: "302021",
      latitude: 26.9124,
      longitude: 75.7873,
      status: PlotStatus.ACTIVE,
      tokenAmount: 4000,
      sellerId: users[2].id,
    },
    {
      title: "Farmhouse Plot in Lonavala",
      description: "Scenic farmhouse plot amidst lush greenery in Lonavala. Perfect for weekend getaway property.",
      price: 3500000,
      area: 0.5,
      areaUnit: "acre",
      state: "Maharashtra",
      city: "Lonavala",
      locality: "Tungarli",
      pincode: "410401",
      latitude: 18.7577,
      longitude: 73.4105,
      status: PlotStatus.ACTIVE,
      tokenAmount: 3000,
      sellerId: users[0].id,
    },
  ];

  let createdCount = 0;
  for (const plotData of plotsData) {
    const existing = await prisma.plot.findFirst({
      where: { title: plotData.title, sellerId: plotData.sellerId },
    });
    if (!existing) {
      await prisma.plot.create({ data: plotData });
      createdCount++;
    }
  }

  console.log(`✅ Created ${createdCount} sample plots`);
  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📧 Admin credentials:");
  console.log("   Email: admin@plotbazaar.in (use OTP login)");
  console.log("   Email: superadmin@plotbazaar.in (use OTP login)");
  console.log("\n👥 Sample user credentials:");
  console.log("   Email: seller1@example.com (use OTP login)");
  console.log("   Email: buyer1@example.com (use OTP login)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
