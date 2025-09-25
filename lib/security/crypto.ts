import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";

import { envServer } from "../env.server";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

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

export function decryptSecret(payload: Buffer): string {
  const ivLength = payload.readUInt8(0);
  const iv = payload.subarray(1, 1 + ivLength);
  const tagLength = payload.readUInt8(1 + ivLength);
  const tagStart = 1 + ivLength + 1;
  const tag = payload.subarray(tagStart, tagStart + tagLength);
  const ciphertext = payload.subarray(tagStart + tagLength);
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
