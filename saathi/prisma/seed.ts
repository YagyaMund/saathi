import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_AGENTS = {
  post_reader: true,
  gap_filler: true,
  post_reviewer: true,
  catalogue_designer: true,
  comment_responder: true,
  salesperson: true,
  negotiator: false,
  order_taker: true,
  payment_verifier: false,
  shift_manager: true,
  shop_analyst: true,
};

async function main() {
  await prisma.sheetRow.deleteMany();
  await prisma.pdfJob.deleteMany();
  await prisma.eveningReport.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.igComment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.item.deleteMany();
  await prisma.unmetAsk.deleteMany();
  await prisma.analyticsSnap.deleteMany();
  await prisma.igPost.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  const sunita = await prisma.user.create({
    data: {
      email: "sunita@saathi.demo",
      name: "Sunita Deshmukh",
      passwordHash: hashSync("sunita123", 10),
    },
  });

  const demoOwner = await prisma.user.create({
    data: {
      email: "demo@saathi.app",
      name: "Demo Seller",
      passwordHash: hashSync("demo1234", 10),
    },
  });

  const shop = await prisma.shop.create({
    data: {
      slug: "sunita-handicrafts",
      name: "Sunita Handicrafts",
      sellerName: "Sunita Deshmukh",
      city: "Jaipur, Rajasthan",
      instagramHandle: "@sunitahandicrafts",
      sellerLanguage: "hi",
      buyerLanguages: "hi,en",
      categories: JSON.stringify([
        "blue pottery",
        "block print textiles",
        "lac bangles",
        "puppets",
      ]),
      variantAxes: JSON.stringify({
        pottery: ["size"],
        bangles: ["size"],
        cushion: ["size", "colour"],
      }),
      upiId: "sunita@okaxis",
      googleConnected: true,
      googleEmail: "sunita.handicrafts@gmail.com",
      spreadsheetId: "local-fixture-sunita",
      instagramSim: true,
      instagramFollowers: 1240,
      agentFlags: JSON.stringify(DEFAULT_AGENTS),
      members: {
        create: [
          { userId: sunita.id, role: "owner" },
          { userId: demoOwner.id, role: "owner" },
        ],
      },
    },
  });

  const vase = await prisma.item.create({
    data: {
      shopId: shop.id,
      sku: "P014",
      name: "Blue pottery vase",
      category: "pottery",
      description:
        "Hand-painted cobalt vase, 9 inch. Made from quartz, not clay, so it is food safe. Fired by karigars in Sanganer.",
      attributes: JSON.stringify({
        material: "quartz, hand-painted",
        colour: "cobalt blue",
        height_in: "9",
        food_safe: "yes",
      }),
      priceInr: 1400,
      floorInr: 1200,
      thumbTone: "pottery",
      approvedAt: new Date("2026-10-07"),
      soldCount: 11,
      usualPrice: 1290,
      variants: {
        create: [{ sku: "P014-STD", label: "standard", stock: 6 }],
      },
    },
  });

  await prisma.item.create({
    data: {
      shopId: shop.id,
      sku: "B007",
      name: "Lac bangles",
      category: "bangles",
      description: "Red and gold lac bangles from Jaipur karigars.",
      attributes: JSON.stringify({ colour: "red and gold" }),
      priceInr: 450,
      floorInr: 400,
      thumbTone: "lac",
      approvedAt: new Date("2026-10-02"),
      soldCount: 14,
      usualPrice: 450,
      variants: {
        create: [
          { sku: "B007-24", label: "2.4", stock: 2 },
          { sku: "B007-26", label: "2.6", stock: 3 },
          { sku: "B007-28", label: "2.8", stock: 0 },
        ],
      },
    },
  });

  await prisma.item.create({
    data: {
      shopId: shop.id,
      sku: "C012",
      name: "Cushion cover",
      category: "cushion",
      description: "Sanganeri block-print cushion cover.",
      attributes: JSON.stringify({ material: "cotton", print: "block" }),
      priceInr: 900,
      floorInr: 800,
      thumbTone: "block",
      approvedAt: new Date("2026-10-06"),
      soldCount: 9,
      usualPrice: 900,
      variants: {
        create: [{ sku: "C012-STD", label: "standard", stock: 4 }],
      },
    },
  });

  await prisma.item.create({
    data: {
      shopId: shop.id,
      sku: "K003",
      name: "Kathputli puppets",
      category: "puppets",
      description: "Pair of traditional Rajasthani Kathputli puppets.",
      attributes: JSON.stringify({}),
      priceInr: 1450,
      floorInr: 1300,
      thumbTone: "puppet",
      approvedAt: new Date("2026-09-20"),
      soldCount: 3,
      usualPrice: 1450,
      status: "sold_out",
      variants: {
        create: [{ sku: "K003-PAIR", label: "pair", stock: 0 }],
      },
    },
  });

  const morning = await prisma.igPost.create({
    data: {
      shopId: shop.id,
      permalink: "ig://sim/18024",
      caption:
        "New blue pottery, fresh from the kiln ✦ DM for price\n#bluepottery #jaipurhandicrafts #handmade",
      postedAt: new Date("2026-10-08T09:02:00Z"),
      photoCount: 6,
      thumbTone: "pottery",
      postType: "multi_product",
      statusLabel: "6 items",
      warnLabel: "3 need a price",
      reviewJson: JSON.stringify([
        {
          tone: "warn",
          title: "You didn't say whether it's food safe",
          body: "7 of your last 20 messages asked this. One line in the caption would cut your replies.",
        },
        {
          tone: "warn",
          title: "No size anywhere",
          body: "People can't tell a 9-inch vase from a 4-inch one in a photo.",
        },
        {
          tone: "ok",
          title: '"DM for price" is working',
          body: "19 messages from this post already. Keep it.",
        },
      ]),
    },
  });

  await prisma.igPost.create({
    data: {
      shopId: shop.id,
      permalink: "ig://sim/18020",
      caption: "Sanganeri block-print cushion covers ₹900",
      postedAt: new Date("2026-10-06T08:00:00Z"),
      photoCount: 3,
      thumbTone: "block",
      postType: "multi_product",
      statusLabel: "3 items live",
      warnLabel: null,
    },
  });

  await prisma.igPost.create({
    data: {
      shopId: shop.id,
      permalink: "ig://sim/18018",
      caption: "Lac bangles straight from the karigars",
      postedAt: new Date("2026-10-02T10:00:00Z"),
      photoCount: 4,
      thumbTone: "lac",
      postType: "multi_product",
      statusLabel: "4 items live",
      warnLabel: "1 sold out",
    },
  });

  await prisma.igPost.create({
    data: {
      shopId: shop.id,
      permalink: "ig://sim/18019",
      caption: "Happy Dussehra to all of you 🪔",
      postedAt: new Date("2026-10-04T11:00:00Z"),
      photoCount: 1,
      thumbTone: "brass",
      postType: "not_a_product",
      statusLabel: "Not a product",
    },
  });

  await prisma.draft.createMany({
    data: [
      {
        shopId: shop.id,
        postId: morning.id,
        draftKey: "d1",
        name: "Blue pottery vase",
        category: "pottery",
        description: "hand-painted · 9 inch",
        attributes: JSON.stringify({ colour: "cobalt", height_in: "9" }),
        priceInr: 1400,
        stock: 6,
        thumbTone: "pottery",
        missing: "[]",
        status: "pending",
        imageIndex: 0,
      },
      {
        shopId: shop.id,
        postId: morning.id,
        draftKey: "d2",
        name: "Lac bangles",
        category: "bangles",
        description: "needs price and sizes",
        attributes: JSON.stringify({}),
        priceInr: null,
        stock: null,
        sizesText: null,
        thumbTone: "lac",
        missing: JSON.stringify(["price", "sizes"]),
        status: "pending",
        imageIndex: 1,
      },
      {
        shopId: shop.id,
        postId: morning.id,
        draftKey: "d3",
        name: "Cushion cover",
        category: "cushion",
        description: "price found in your caption",
        attributes: JSON.stringify({}),
        priceInr: 900,
        stock: null,
        thumbTone: "block",
        missing: JSON.stringify(["stock"]),
        status: "pending",
        imageIndex: 2,
      },
      {
        shopId: shop.id,
        postId: morning.id,
        draftKey: "d4",
        name: "Dussehra greeting",
        category: "other",
        description: "not a product — will be skipped",
        attributes: "{}",
        thumbTone: "brass",
        missing: "[]",
        status: "skipped",
        skipReason: "not_a_product",
        imageIndex: 5,
      },
    ],
  });

  const priya = await prisma.conversation.create({
    data: {
      shopId: shop.id,
      buyerName: "Priya Kulkarni",
      channel: "dm",
      needsSeller: true,
      chip: "Not in your catalogue",
      chipTone: "warn",
      lastPreview: "do you have a full dinner set? for daily use",
      lastAt: new Date(Date.now() - 18 * 60 * 1000),
      windowHoursLeft: 3,
      handledBySaathi: false,
      messages: {
        create: [
          {
            sender: "buyer",
            body: "is this real Jaipur blue pottery or just ceramic?",
          },
          {
            sender: "saathi",
            body: "Real Jaipur blue pottery — made from quartz, not clay, and hand-painted. Sunita ji gets them from karigars in Sanganer.",
          },
          {
            sender: "buyer",
            body: "nice. do you have a full dinner set? for daily use",
          },
          {
            sender: "system",
            body: "Saathi stopped here",
            kind: "stopline",
          },
          {
            sender: "system",
            body: JSON.stringify({
              title: "You only list single pieces",
              detail:
                "I didn't want to promise a set you may not make. She's been chatting 6 minutes, looked at 3 vases, and bought from you twice before.",
            }),
            kind: "escalation",
          },
          {
            sender: "saathi",
            body: "Let me check with Sunita ji and tell you shortly.",
            kind: "holding",
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      shopId: shop.id,
      buyerName: "Anjali Deshpande",
      needsSeller: true,
      chip: "Amount doesn't match",
      chipTone: "warn",
      lastPreview: "sent a payment screenshot",
      lastAt: new Date(Date.now() - 60 * 60 * 1000),
      windowHoursLeft: 20,
      messages: {
        create: [
          { sender: "buyer", body: "sending payment for the puppets" },
          {
            sender: "system",
            body: JSON.stringify({
              title: "Payment screenshot does not match",
              detail: "Screenshot says ₹1,100 · order is ₹1,450",
            }),
            kind: "escalation",
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      shopId: shop.id,
      buyerName: "Meera Shinde",
      needsSeller: true,
      chip: "Asked for you",
      chipTone: "warn",
      lastPreview: "can I talk to Sunita ji directly?",
      lastAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      windowHoursLeft: 19,
      messages: {
        create: [
          { sender: "buyer", body: "can I talk to Sunita ji directly?" },
          {
            sender: "system",
            body: JSON.stringify({
              title: "Buyer asked for you",
              detail: "Shift manager stopped the line.",
            }),
            kind: "escalation",
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      shopId: shop.id,
      buyerName: "Rupali Jadhav",
      needsSeller: false,
      chip: "Ordered · ₹1,290",
      chipTone: "ok",
      lastPreview: "done, sending payment now",
      lastAt: new Date("2026-10-07T23:06:00Z"),
      handledBySaathi: true,
      messages: {
        create: [
          { sender: "buyer", body: "I'll take the cobalt vase" },
          { sender: "saathi", body: "₹1,290 including packing. Pay on the QR." },
          { sender: "buyer", body: "done, sending payment now" },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      shopId: shop.id,
      buyerName: "Kavita Pawar",
      needsSeller: false,
      chip: "Left at the price",
      chipTone: "neutral",
      lastPreview: "ok I'll think about it",
      lastAt: new Date("2026-10-07T21:40:00Z"),
      handledBySaathi: true,
      messages: {
        create: [
          { sender: "buyer", body: "price for the vase?" },
          { sender: "saathi", body: "₹1,400 for the cobalt vase." },
          { sender: "buyer", body: "ok I'll think about it" },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      shopId: shop.id,
      buyerName: "Snehal Kulkarni",
      needsSeller: false,
      chip: "Wanted 2.8 · recorded",
      chipTone: "neutral",
      lastPreview: "bangles in 2.8 size?",
      lastAt: new Date("2026-10-07T20:12:00Z"),
      handledBySaathi: true,
      messages: {
        create: [
          { sender: "buyer", body: "bangles in 2.8 size?" },
          {
            sender: "saathi",
            body: "2.8 is sold out right now. I told Sunita ji — she will restock.",
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      shopId: shop.id,
      buyerName: "Priya K",
      status: "paid_to_pack",
      totalInr: 1290,
      paidInr: 1290,
      items: {
        create: [
          { itemId: vase.id, name: "Blue pottery vase", priceInr: 1290, qty: 1 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      shopId: shop.id,
      buyerName: "Anjali D",
      status: "payment_to_check",
      totalInr: 1450,
      paidInr: 1100,
      paymentNote: "Screenshot says ₹1,100 · order is ₹1,450",
      items: {
        create: [{ name: "Kathputli puppets", priceInr: 1450, qty: 1 }],
      },
    },
  });

  await prisma.unmetAsk.createMany({
    data: [
      { shopId: shop.id, label: "Blue pottery dinner set", count: 9 },
      { shopId: shop.id, label: "Bangles in size 2.8", count: 5 },
      { shopId: shop.id, label: "Green block-print cushions", count: 3 },
      { shopId: shop.id, label: "Same vase in green", count: 2 },
    ],
  });

  await prisma.analyticsSnap.create({
    data: {
      shopId: shop.id,
      weekPeople: 47,
      weekOrders: 6,
      weekEarned: 8340,
      todayOrders: 2,
      todayEarned: 2740,
      todayMessages: 19,
      dropoffsJson: JSON.stringify([
        { label: "Saw the post, never messaged", count: 22 },
        { label: "Asked, then went quiet", count: 11 },
        { label: "Left after hearing the price", count: 7 },
        { label: "Agreed, never paid", count: 1 },
      ]),
    },
  });

  await prisma.eveningReport.create({
    data: {
      shopId: shop.id,
      body: "Aaj do order — ₹2,740. Nau log dinner set maang rahe hain, aapke paas nahi hai. Anjali ka payment match nahi hua — screenshot ₹1,100, order ₹1,450.",
    },
  });

  // silence unused
  void priya;
  console.log("Seeded Sunita Handicrafts");
  console.log("Login: sunita@saathi.demo / sunita123  or  demo@saathi.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
