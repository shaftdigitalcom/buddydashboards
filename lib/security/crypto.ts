import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";

import { envServer } from "../env.server";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  return createHash("sha256").update(envServer.KOMMO_TOKEN_SECRET).digest();
}

export function encryptSecret(plain: string): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([
    Buffer.from([IV_LENGTH]),
    iv,
    Buffer.from([tag.length]),
    tag,
    ciphertext,
  ]);
}

export function bufferToHex(buffer: Buffer): string {
  return `\\x${buffer.toString("hex")}`;
}

export function hexToBuffer(hex: string): Buffer {
  const clean = hex.startsWith("\\x") || hex.startsWith("0x") ? hex.slice(2) : hex;
  return Buffer.from(clean, "hex");
}

export function decryptSecret(payload: Buffer | string): string {
  const buffer = typeof payload === "string" ? hexToBuffer(payload) : payload;
  if (buffer.length < 2) {
    throw new Error("Invalid encrypted payload");
  }

  const ivLength = buffer[0];
  let offset = 1;
  const iv = buffer.subarray(offset, offset + ivLength);
  offset += ivLength;

  const tagLength = buffer[offset];
  offset += 1;
  const tag = buffer.subarray(offset, offset + tagLength);
  offset += tagLength;

  const ciphertext = buffer.subarray(offset);
  const key = getKey();

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
