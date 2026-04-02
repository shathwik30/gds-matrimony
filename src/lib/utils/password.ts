export function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@#$%&*!?";
  const all = upper + lower + digits + special;
  // Ensure at least one of each required type
  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
