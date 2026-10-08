import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "saathi_session";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "saathi-dev-secret-change-me",
  );
}

export type Session = {
  userId: string;
  email: string;
  name: string;
  shopId: string;
};

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function signupEmail(opts: {
  email: string;
  name: string;
  password: string;
  shopName: string;
  city: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing) throw new Error("Email already registered");
  const slugBase = opts.shopName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  let slug = slugBase || "shop";
  let n = 0;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugBase}-${n}`;
  }
  const user = await prisma.user.create({
    data: {
      email: opts.email,
      name: opts.name,
      passwordHash: await hash(opts.password, 10),
    },
  });
  const shop = await prisma.shop.create({
    data: {
      slug,
      name: opts.shopName,
      sellerName: opts.name,
      city: opts.city || "India",
      agentFlags: JSON.stringify({
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
      }),
      members: { create: [{ userId: user.id, role: "owner" }] },
      analyticsSnap: {
        create: {
          weekPeople: 0,
          weekOrders: 0,
          weekEarned: 0,
          todayOrders: 0,
          todayEarned: 0,
          todayMessages: 0,
          dropoffsJson: "[]",
        },
      },
    },
  });
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    shopId: shop.id,
  });
  return { user, shop };
}

export async function loginEmail(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { orderBy: { id: "asc" }, take: 1 } },
  });
  if (!user?.passwordHash) throw new Error("Invalid email or password");
  const ok = await compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid email or password");
  const shopId = user.memberships[0]?.shopId;
  if (!shopId) throw new Error("No shop on this account");
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    shopId,
  });
  return user;
}

/** Stub Google Sign-In — creates/links a demo Google identity without real OAuth. */
export async function stubGoogleSignIn(opts: {
  email: string;
  name: string;
  connectSheet?: boolean;
}) {
  let user = await prisma.user.findUnique({
    where: { email: opts.email },
    include: { memberships: true },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: opts.email,
        name: opts.name,
        googleSub: `stub-google-${opts.email}`,
        memberships: {
          create: {
            role: "owner",
            shop: {
              create: {
                slug: `shop-${Date.now().toString(36)}`,
                name: `${opts.name}'s Shop`,
                sellerName: opts.name,
                city: "India",
                googleConnected: Boolean(opts.connectSheet),
                googleEmail: opts.connectSheet ? opts.email : null,
                spreadsheetId: opts.connectSheet ? `local-${Date.now()}` : null,
                agentFlags: JSON.stringify({
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
                }),
                analyticsSnap: {
                  create: {
                    weekPeople: 0,
                    weekOrders: 0,
                    weekEarned: 0,
                    todayOrders: 0,
                    todayEarned: 0,
                    todayMessages: 0,
                    dropoffsJson: "[]",
                  },
                },
              },
            },
          },
        },
      },
      include: { memberships: true },
    });
  } else if (!user.googleSub) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleSub: `stub-google-${opts.email}` },
      include: { memberships: true },
    });
  }
  const shopId = user.memberships[0]?.shopId;
  if (!shopId) throw new Error("No shop");
  if (opts.connectSheet) {
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        googleConnected: true,
        googleEmail: opts.email,
        spreadsheetId: `local-${shopId.slice(0, 8)}`,
      },
    });
  }
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    shopId,
  });
  return user;
}

export async function switchShop(userId: string, shopId: string) {
  const membership = await prisma.shopMember.findFirst({
    where: { userId, shopId },
  });
  if (!membership) throw new Error("Not a member of that shop");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    shopId,
  });
}
