/**
 * Newsletter delivery is deliberately opt-in while DGNO's email product is
 * tabled. A SendGrid key used by the newsroom contact form is not enough to
 * enable bulk mail.
 */
export function newsletterEmailEnabled(value: unknown): boolean {
  return value === "true";
}
