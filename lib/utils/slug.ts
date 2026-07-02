import { customAlphabet } from "nanoid";

// Excludes visually ambiguous characters (0/O, 1/I/l).
const nanoid = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
  10
);

export function generateExperienceSlug() {
  return nanoid();
}
