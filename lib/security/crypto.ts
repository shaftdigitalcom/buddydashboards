import { createHash, randomBytes, createCipheriv } from "crypto";

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
