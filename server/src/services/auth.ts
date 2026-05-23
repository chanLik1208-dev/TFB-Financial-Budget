import { hash, verify } from "@node-rs/argon2";

// 密碼去敏：argon2id 哈希。註冊與登入都只比對哈希值，永不存明文。
export function hashPassword(plain: string): Promise<string> {
  return hash(plain); // argon2id 預設，內含每密碼隨機 salt
}

export function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  return verify(storedHash, plain);
}
