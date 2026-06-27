import { z } from "zod";

export const EmailSchema = z.string().email("Invalid email address");

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Email {
    const parsed = EmailSchema.parse(value);
    return new Email(parsed.toLowerCase());
  }

  static unsafeCreate(value: string): Email {
    return new Email(value.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email | string): boolean {
    if (typeof other === "string") {
      return this.value === other.toLowerCase();
    }
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}

export type CreateEmailInput = z.infer<typeof EmailSchema>;
