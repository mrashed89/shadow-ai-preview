import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "./db";

export type BuddyLockData = {
  buddyId: string;
  lockedAt: string;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  buddyLock: BuddyLockData | null;
  memory: Record<string, string>;
};

const VAULT = "shadow_vault";

function secretKey() {
  const secret = process.env.AUTH_SECRET || "shadow-ai-demo-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

/** Vercel serverless has no durable SQLite filesystem — use signed cookies there. */
export function useCookieStore() {
  return process.env.VERCEL === "1" || process.env.SHADOW_STORE === "cookie";
}

function idFromEmail(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24);
}

async function readVault(): Promise<UserRecord | null> {
  const jar = await cookies();
  const token = jar.get(VAULT)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    const memory =
      payload.memory && typeof payload.memory === "object" && !Array.isArray(payload.memory)
        ? (payload.memory as Record<string, string>)
        : {};
    const buddyLock =
      payload.buddyLock && typeof payload.buddyLock === "object"
        ? (payload.buddyLock as BuddyLockData)
        : null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      buddyLock,
      memory,
    };
  } catch {
    return null;
  }
}

async function writeVault(user: UserRecord) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    buddyLock: user.buddyLock,
    memory: user.memory,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(VAULT, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearVault() {
  const jar = await cookies();
  jar.delete(VAULT);
}

export async function upsertUser(input: { email: string; name: string }): Promise<UserRecord> {
  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();

  if (useCookieStore()) {
    const existing = await readVault();
    const user: UserRecord =
      existing && existing.email === email
        ? { ...existing, name, memory: { ...existing.memory, name } }
        : {
            id: idFromEmail(email),
            email,
            name,
            buddyLock: null,
            memory: { name },
          };
    await writeVault(user);
    return user;
  }

  const row = await prisma.user.upsert({
    where: { email },
    create: { email, name },
    update: { name },
    include: { buddyLock: true, memories: true },
  });
  await prisma.memory.upsert({
    where: { userId_key: { userId: row.id, key: "name" } },
    create: { userId: row.id, key: "name", value: name },
    update: { value: name },
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    buddyLock: row.buddyLock
      ? { buddyId: row.buddyLock.buddyId, lockedAt: row.buddyLock.lockedAt.toISOString() }
      : null,
    memory: Object.fromEntries(
      (await prisma.memory.findMany({ where: { userId: row.id } })).map((m) => [m.key, m.value]),
    ),
  };
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (useCookieStore()) {
    const vault = await readVault();
    if (!vault || vault.id !== id) return null;
    return vault;
  }

  const row = await prisma.user.findUnique({
    where: { id },
    include: { buddyLock: true, memories: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    buddyLock: row.buddyLock
      ? { buddyId: row.buddyLock.buddyId, lockedAt: row.buddyLock.lockedAt.toISOString() }
      : null,
    memory: Object.fromEntries(row.memories.map((m) => [m.key, m.value])),
  };
}

export async function lockBuddy(userId: string, buddyId: string): Promise<UserRecord> {
  if (useCookieStore()) {
    const vault = await readVault();
    if (!vault || vault.id !== userId) throw new Error("NOT_FOUND");
    if (vault.buddyLock) {
      const err = new Error("ALREADY_LOCKED") as Error & { user: UserRecord };
      err.user = vault;
      throw err;
    }
    const next: UserRecord = {
      ...vault,
      buddyLock: { buddyId, lockedAt: new Date().toISOString() },
      memory: { ...vault.memory, buddy: buddyId === "mira" ? "Mira" : buddyId },
    };
    await writeVault(next);
    return next;
  }

  const existing = await prisma.buddyLock.findUnique({ where: { userId } });
  if (existing) {
    const user = await getUserById(userId);
    const err = new Error("ALREADY_LOCKED") as Error & { user: UserRecord };
    err.user = user!;
    throw err;
  }

  await prisma.buddyLock.create({ data: { userId, buddyId } });
  await prisma.memory.upsert({
    where: { userId_key: { userId, key: "buddy" } },
    create: { userId, key: "buddy", value: buddyId === "mira" ? "Mira" : buddyId },
    update: { value: buddyId === "mira" ? "Mira" : buddyId },
  });
  return (await getUserById(userId))!;
}

export async function updateMemory(userId: string, updates: Record<string, string>) {
  if (useCookieStore()) {
    const vault = await readVault();
    if (!vault || vault.id !== userId) throw new Error("NOT_FOUND");
    const memory = { ...vault.memory };
    for (const [key, value] of Object.entries(updates)) {
      if (!key || !value.trim() || key === "buddy") continue;
      memory[key] = value.trim().slice(0, 500);
    }
    const next = { ...vault, memory };
    await writeVault(next);
    return memory;
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!key || !value.trim() || key === "buddy") continue;
    await prisma.memory.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, value: value.trim().slice(0, 500) },
      update: { value: value.trim().slice(0, 500) },
    });
  }
  const rows = await prisma.memory.findMany({ where: { userId } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
