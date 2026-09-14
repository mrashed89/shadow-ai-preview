import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash } from "crypto";

export type BuddyLockData = { buddyId: string; lockedAt: string };

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  buddyLock: BuddyLockData | null;
  memory: Record<string, string>;
};

const VAULT = "shadow_vault";

function secretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "shadow-ai-demo-secret-change-in-production",
  );
}

function idFromEmail(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24);
}

async function readVault(): Promise<UserRecord | null> {
  const token = (await cookies()).get(VAULT)?.value;
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
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      buddyLock:
        payload.buddyLock && typeof payload.buddyLock === "object"
          ? (payload.buddyLock as BuddyLockData)
          : null,
      memory:
        payload.memory && typeof payload.memory === "object" && !Array.isArray(payload.memory)
          ? (payload.memory as Record<string, string>)
          : {},
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
  (await cookies()).set(VAULT, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearVault() {
  (await cookies()).delete(VAULT);
}

export async function upsertUser(input: { email: string; name: string }): Promise<UserRecord> {
  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();
  const existing = await readVault();
  const user: UserRecord =
    existing && existing.email === email
      ? { ...existing, name, memory: { ...existing.memory, name } }
      : { id: idFromEmail(email), email, name, buddyLock: null, memory: { name } };
  await writeVault(user);
  return user;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const vault = await readVault();
  return vault && vault.id === id ? vault : null;
}

export async function lockBuddy(userId: string, buddyId: string): Promise<UserRecord> {
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

export async function updateMemory(userId: string, updates: Record<string, string>) {
  const vault = await readVault();
  if (!vault || vault.id !== userId) throw new Error("NOT_FOUND");
  const memory = { ...vault.memory };
  for (const [k, v] of Object.entries(updates)) {
    if (!k || !v.trim() || k === "buddy") continue;
    memory[k] = v.trim().slice(0, 500);
  }
  await writeVault({ ...vault, memory });
  return memory;
}
