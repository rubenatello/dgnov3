export const CONTACT_TOPICS = [
  "reporting",
  "correction",
  "tracker",
  "accessibility",
  "privacy",
  "general",
] as const;

export type ContactTopic = typeof CONTACT_TOPICS[number];

export interface ContactSubmission {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  sourceUrl?: string;
  isHoneypot: boolean;
}

export class ContactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactValidationError";
  }
}

function recordValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContactValidationError("The submission must be an object");
  }
  return value as Record<string, unknown>;
}

function textValue(
  value: unknown,
  label: string,
  maximum: number,
  minimum = 1,
): string {
  if (typeof value !== "string") {
    throw new ContactValidationError(`${label} is required`);
  }
  const result = value.replace(/\s+/g, " ").trim();
  if (result.length < minimum || result.length > maximum) {
    throw new ContactValidationError(
      `${label} must be between ${minimum} and ${maximum} characters`,
    );
  }
  return result;
}

function emailValue(value: unknown): string {
  const email = textValue(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContactValidationError("Email must be a valid address");
  }
  return email;
}

function optionalHttpUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const rawUrl = textValue(value, "Page URL", 1000);
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    if (url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new ContactValidationError("Page URL must use http or https");
  }
}

/** Validate and normalize the untrusted public contact payload. */
export function parseContactSubmission(value: unknown): ContactSubmission {
  const record = recordValue(value);
  const topic = textValue(record.topic, "Topic", 40) as ContactTopic;
  if (!CONTACT_TOPICS.includes(topic)) {
    throw new ContactValidationError("Topic is not supported");
  }

  return {
    name: textValue(record.name, "Name", 120),
    email: emailValue(record.email),
    topic,
    message: textValue(record.message, "Message", 5000, 20),
    sourceUrl: optionalHttpUrl(record.sourceUrl),
    isHoneypot: typeof record.company === "string" &&
      record.company.trim().length > 0,
  };
}
