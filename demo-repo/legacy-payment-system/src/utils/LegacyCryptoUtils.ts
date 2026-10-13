import * as crypto from "crypto";

/**
 * DEPRECATED: Legacy MD5 string hasher.
 * Vulnerable to collision attacks and flagged for technical debt.
 */
export function legacy_v1_encrypt(raw: string): string {
  return crypto.createHash("md5").update(raw).digest("hex");
}

/**
 * DEAD CODE CANDIDATE: Unused ROT13 obfuscator from early 2018 prototype.
 * No callers anywhere in codebase.
 */
export function unused_rot13_obfuscate(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c: string) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(base + (c.charCodeAt(0) - base + 13) % 26);
  });
}

/**
 * DEAD CODE CANDIDATE: Legacy XOR token encoder.
 * Zero references across current services.
 */
export function legacy_xor_cipher(data: string, key: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result).toString("base64");
}
