import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin
  const adminPasswordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: "admin@lenstrack.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@lenstrack.com",
      passwordHash: adminPasswordHash,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: "Single Vision" }, update: {}, create: { name: "Single Vision" } }),
    prisma.category.upsert({ where: { name: "Bifocal" }, update: {}, create: { name: "Bifocal" } }),
    prisma.category.upsert({ where: { name: "Progressive" }, update: {}, create: { name: "Progressive" } }),
    prisma.category.upsert({ where: { name: "Blue Cut" }, update: {}, create: { name: "Blue Cut" } }),
    prisma.category.upsert({ where: { name: "Photochromic" }, update: {}, create: { name: "Photochromic" } }),
  ]);
  console.log("✅ Categories created");

  // Vision Types
  const visionTypes = await Promise.all([
    prisma.visionType.upsert({ where: { name: "Distance" }, update: {}, create: { name: "Distance" } }),
    prisma.visionType.upsert({ where: { name: "Near" }, update: {}, create: { name: "Near" } }),
    prisma.visionType.upsert({ where: { name: "Bifocal" }, update: {}, create: { name: "Bifocal" } }),
    prisma.visionType.upsert({ where: { name: "Progressive" }, update: {}, create: { name: "Progressive" } }),
  ]);
  console.log("✅ Vision types created");

  // Warranty Durations
  const warrantyDurations = await Promise.all([
    prisma.warrantyDuration.upsert({ where: { label: "6 Months" }, update: {}, create: { label: "6 Months", months: 6 } }),
    prisma.warrantyDuration.upsert({ where: { label: "1 Year" }, update: {}, create: { label: "1 Year", months: 12 } }),
    prisma.warrantyDuration.upsert({ where: { label: "2 Years" }, update: {}, create: { label: "2 Years", months: 24 } }),
  ]);
  console.log("✅ Warranty durations created");

  // Common Benefits
  const benefits = await Promise.all([
    prisma.commonBenefit.upsert({ where: { label: "UV Protection" }, update: {}, create: { label: "UV Protection" } }),
    prisma.commonBenefit.upsert({ where: { label: "Anti-Glare Coating" }, update: {}, create: { label: "Anti-Glare Coating" } }),
    prisma.commonBenefit.upsert({ where: { label: "Scratch Resistant" }, update: {}, create: { label: "Scratch Resistant" } }),
    prisma.commonBenefit.upsert({ where: { label: "Blue Light Block" }, update: {}, create: { label: "Blue Light Block" } }),
    prisma.commonBenefit.upsert({ where: { label: "Water Repellent" }, update: {}, create: { label: "Water Repellent" } }),
    prisma.commonBenefit.upsert({ where: { label: "Dust Repellent" }, update: {}, create: { label: "Dust Repellent" } }),
    prisma.commonBenefit.upsert({ where: { label: "Impact Resistant" }, update: {}, create: { label: "Impact Resistant" } }),
    prisma.commonBenefit.upsert({ where: { label: "Anti-Fog" }, update: {}, create: { label: "Anti-Fog" } }),
  ]);
  console.log("✅ Common benefits created");

  // Stores
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { id: "store_mumbai_1" },
      update: {},
      create: {
        id: "store_mumbai_1",
        name: "Lenstrack Vision Center - Bandra",
        city: "Mumbai",
        address: "Shop 12, Hill Road, Bandra West, Mumbai - 400050",
        phone: "9820001001",
      },
    }),
    prisma.store.upsert({
      where: { id: "store_delhi_1" },
      update: {},
      create: {
        id: "store_delhi_1",
        name: "Lenstrack Optics - Connaught Place",
        city: "Delhi",
        address: "Block A-14, Connaught Place, New Delhi - 110001",
        phone: "9810002002",
      },
    }),
    prisma.store.upsert({
      where: { id: "store_bangalore_1" },
      update: {},
      create: {
        id: "store_bangalore_1",
        name: "Lenstrack Eye Care - Indiranagar",
        city: "Bangalore",
        address: "100 Feet Road, Indiranagar, Bangalore - 560038",
        phone: "9900003003",
      },
    }),
  ]);
  console.log("✅ Stores created");

  // Store Users
  const storePasswordHash = await bcrypt.hash("Store@123", 12);
  const storeUsers = await Promise.all([
    prisma.storeUser.upsert({
      where: { email: "mumbai@lenstrack.com" },
      update: {},
      create: {
        name: "Raj Sharma",
        email: "mumbai@lenstrack.com",
        phone: "9820001002",
        passwordHash: storePasswordHash,
        storeId: "store_mumbai_1",
      },
    }),
    prisma.storeUser.upsert({
      where: { email: "delhi@lenstrack.com" },
      update: {},
      create: {
        name: "Priya Mehta",
        email: "delhi@lenstrack.com",
        phone: "9810002003",
        passwordHash: storePasswordHash,
        storeId: "store_delhi_1",
      },
    }),
    prisma.storeUser.upsert({
      where: { email: "bangalore@lenstrack.com" },
      update: {},
      create: {
        name: "Arun Kumar",
        email: "bangalore@lenstrack.com",
        phone: "9900003004",
        passwordHash: storePasswordHash,
        storeId: "store_bangalore_1",
      },
    }),
  ]);
  console.log("✅ Store users created");

  // Products
  const [catSV, catBifocal, catProg, catBlue, catPhoto] = categories;
  const [vtDist, vtNear, vtBifocal, vtProg] = visionTypes;
  const [wd6m, wd1y, wd2y] = warrantyDurations;
  const [bUV, bAG, bSR, bBL, bWR, bDR, bIR, bAF] = benefits;

  const products = [
    {
      code: "LT-SV-001",
      name: "ClearVision Pro 1.56",
      description: "High-clarity single vision lens with premium anti-glare coating for everyday wear.",
      categoryId: catSV.id,
      visionTypeId: vtDist.id,
      warrantyDurationId: wd1y.id,
      warrantyPolicy: "1 year manufacturer warranty against manufacturing defects. Covers delamination, coating peeling, and lens breakage under normal use.",
      customBenefits: ["1.56 Index", "Thin & Light"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-SV-002",
      name: "ClearVision Pro 1.60",
      description: "Thinner 1.60 index single vision lens, ideal for moderate to high prescriptions.",
      categoryId: catSV.id,
      visionTypeId: vtDist.id,
      warrantyDurationId: wd1y.id,
      warrantyPolicy: "1 year manufacturer warranty against manufacturing defects.",
      customBenefits: ["1.60 Index", "Thinner Profile"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id, bDR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-BC-001",
      name: "BlueShield Digital",
      description: "Advanced blue light blocking lens designed for digital device users. Reduces digital eye strain.",
      categoryId: catBlue.id,
      visionTypeId: vtDist.id,
      warrantyDurationId: wd2y.id,
      warrantyPolicy: "2 year warranty. Covers coating integrity and lens structural defects.",
      customBenefits: ["Blocks 40% Blue Light", "Reduces Eye Strain", "Zero-Power Available"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bBL.id, bWR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-BC-002",
      name: "BlueShield Plus",
      description: "Premium blue cut lens with enhanced coating for professionals spending extended hours on screens.",
      categoryId: catBlue.id,
      visionTypeId: vtNear.id,
      warrantyDurationId: wd2y.id,
      warrantyPolicy: "2 year comprehensive warranty on lens and coating.",
      customBenefits: ["Blocks 60% Blue Light", "Premium Coating", "Night Mode Ready"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bBL.id, bWR.id, bDR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-PH-001",
      name: "SunAdapt Transitions",
      description: "Photochromic lens that automatically darkens in sunlight and clears indoors.",
      categoryId: catPhoto.id,
      visionTypeId: vtDist.id,
      warrantyDurationId: wd2y.id,
      warrantyPolicy: "2 year warranty. Photochromic performance guaranteed for the warranty period.",
      customBenefits: ["Auto-Darkening", "100% UV Block in Sun", "Suitable for All Prescriptions"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id, bIR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-BF-001",
      name: "ReadEase Bifocal D28",
      description: "Traditional flat-top D28 bifocal lens for distance and near vision correction.",
      categoryId: catBifocal.id,
      visionTypeId: vtBifocal.id,
      warrantyDurationId: wd1y.id,
      warrantyPolicy: "1 year warranty on optical performance and coating.",
      customBenefits: ["D-28 Segment", "Hard Resin"],
      benefitIds: [bUV.id, bAG.id, bSR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-PG-001",
      name: "Visio Progressive Standard",
      description: "Entry-level progressive lens providing seamless vision correction from distance to near.",
      categoryId: catProg.id,
      visionTypeId: vtProg.id,
      warrantyDurationId: wd1y.id,
      warrantyPolicy: "1 year warranty. Free replacement if adaptation is not achieved within 30 days.",
      customBenefits: ["Wide Intermediate Zone", "Beginner Friendly"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id],
      progressiveFeatures: ["Wide Distance Zone", "Comfortable Near Vision", "Smooth Progression", "30-Day Adaptation Guarantee"],
    },
    {
      code: "LT-PG-002",
      name: "Visio Progressive Premium",
      description: "Premium digital freeform progressive lens with customized optical design for superior visual comfort.",
      categoryId: catProg.id,
      visionTypeId: vtProg.id,
      warrantyDurationId: wd2y.id,
      warrantyPolicy: "2 year comprehensive warranty. Free re-glazing within 60 days for any adaptation issues.",
      customBenefits: ["Freeform Digital Design", "Wider Vision Zones", "Personalized Optics"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id, bDR.id, bBL.id],
      progressiveFeatures: ["Expansive Distance Zone", "Wide Intermediate Corridor", "Large Near Zone", "Minimal Swim Effect", "Customized for Frame", "60-Day Free Adaptation"],
    },
    {
      code: "LT-SV-003",
      name: "ClearVision HD 1.67",
      description: "Ultra-thin 1.67 index lens for high prescriptions. Maximum thinness with superior optics.",
      categoryId: catSV.id,
      visionTypeId: vtDist.id,
      warrantyDurationId: wd2y.id,
      warrantyPolicy: "2 year premium warranty. Includes one free remake within 6 months if prescription changes.",
      customBenefits: ["1.67 Index", "Ultra Thin", "High Prescription Ready", "Superior Optics"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id, bDR.id, bIR.id],
      progressiveFeatures: [],
    },
    {
      code: "LT-PH-002",
      name: "SunAdapt Brown",
      description: "Brown-tinted photochromic lens offering enhanced contrast and reduced glare in bright conditions.",
      categoryId: catPhoto.id,
      visionTypeId: vtDist.id,
      warrantyDurationId: wd2y.id,
      warrantyPolicy: "2 year warranty with photochromic performance guarantee.",
      customBenefits: ["Brown Photochromic", "Enhanced Contrast", "Outdoor Ready"],
      benefitIds: [bUV.id, bAG.id, bSR.id, bWR.id, bIR.id, bAF.id],
      progressiveFeatures: [],
    },
  ];

  for (const product of products) {
    const { benefitIds, progressiveFeatures, ...productData } = product;

    const existing = await prisma.product.findUnique({ where: { code: productData.code } });
    if (existing) {
      console.log(`  ↩️  Product already exists: ${productData.code}`);
      continue;
    }

    await prisma.product.create({
      data: {
        ...productData,
        commonBenefits: {
          create: benefitIds.map((id) => ({ commonBenefitId: id })),
        },
        progressiveFeatures: {
          create: progressiveFeatures.map((label) => ({ label })),
        },
      },
    });
    console.log(`  ✅ Product: ${productData.code} - ${productData.name}`);
  }
  console.log("✅ Products created");

  // Lens Care Tips
  const tips = [
    { title: "Clean with Microfiber Cloth", content: "Always use a clean, soft microfiber cloth to wipe your lenses. Avoid using paper tissues, clothing, or rough materials as they can scratch the coating.", order: 1 },
    { title: "Rinse Before Wiping", content: "Rinse your lenses with lukewarm water before wiping to remove dust particles that could scratch the lens surface.", order: 2 },
    { title: "Use Lens Cleaning Solution", content: "Apply a few drops of approved lens cleaning solution. Avoid household cleaners, soaps with moisturizers, or acetone-based products.", order: 3 },
    { title: "Store in a Case", content: "Always store your glasses in a protective case when not in use. This prevents accidental damage and keeps the lenses clean.", order: 4 },
    { title: "Avoid Extreme Heat", content: "Do not leave glasses in a hot car or near heat sources. Extreme heat can warp the frame and damage the lens coating.", order: 5 },
    { title: "Handle with Both Hands", content: "Use both hands to put on and remove your glasses. This prevents frame warping and reduces stress on the hinges.", order: 6 },
  ];

  for (const tip of tips) {
    await prisma.lensCareTip.upsert({
      where: { id: `tip_${tip.order}` },
      update: {},
      create: { id: `tip_${tip.order}`, ...tip },
    });
  }
  console.log("✅ Lens care tips created");

  // Sample customers and orders
  const allProducts = await prisma.product.findMany({ include: { category: true, visionType: true, warrantyDuration: true, commonBenefits: { include: { commonBenefit: true } }, progressiveFeatures: true } });
  const allStoreUsers = await prisma.storeUser.findMany();
  const allStores = await prisma.store.findMany();

  const sampleCustomers = [
    { mobile: "9876543210", name: "Amit Verma" },
    { mobile: "9876543211", name: "Sneha Patel" },
    { mobile: "9876543212", name: "Ravi Kumar" },
    { mobile: "9876543213", name: "Pooja Singh" },
    { mobile: "9876543214", name: "Deepak Nair" },
  ];

  for (let ci = 0; ci < sampleCustomers.length; ci++) {
    const sc = sampleCustomers[ci];
    const customer = await prisma.customer.upsert({
      where: { mobile: sc.mobile },
      update: {},
      create: { mobile: sc.mobile },
    });

    const storeUser = allStoreUsers[ci % allStoreUsers.length];
    const store = allStores[ci % allStores.length];

    for (let oi = 0; oi < 2; oi++) {
      const product = allProducts[(ci * 2 + oi) % allProducts.length];
      const invoiceNumber = `INV-${Date.now()}-${ci}-${oi}`;

      const existingOrder = await prisma.order.findFirst({
        where: { invoiceNumber, storeId: store.id },
      });
      if (existingOrder) continue;

      const snapshot = {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        category: product.category.name,
        visionType: product.visionType.name,
        warrantyDuration: product.warrantyDuration.label,
        warrantyMonths: product.warrantyDuration.months,
        warrantyPolicy: product.warrantyPolicy,
        benefits: product.commonBenefits.map((b) => b.commonBenefit.label),
        customBenefits: product.customBenefits,
        progressiveFeatures: product.progressiveFeatures.map((f) => f.label),
        snapshotAt: new Date().toISOString(),
      };

      await prisma.order.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          customerName: sc.name,
          storeId: store.id,
          storeUserId: storeUser.id,
          lensItems: {
            create: {
              productId: product.id,
              productSnapshot: snapshot,
              rightEyeSph: "-1.25",
              rightEyeCyl: "-0.50",
              rightEyeAxis: "180",
              leftEyeSph: "-1.00",
              leftEyeCyl: "-0.25",
              leftEyeAxis: "175",
            },
          },
        },
      });
    }
  }
  console.log("✅ Sample customers and orders created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin: admin@lenstrack.com / Admin@123");
  console.log("  Store (Mumbai): mumbai@lenstrack.com / Store@123");
  console.log("  Store (Delhi): delhi@lenstrack.com / Store@123");
  console.log("  Store (Bangalore): bangalore@lenstrack.com / Store@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
