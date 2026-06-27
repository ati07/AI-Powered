/**
 * Lightweight logger abstraction.
 *
 * The worker must never call console.log directly.
 * Use the logger everywhere for structured, prefix-based logging.
 */

export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/* ──────────────── Implementations ──────────────── */

/**
 * Prefix-based console logger.
 */
export class ConsoleLogger implements ILogger {
  constructor(private readonly prefix: string = "[Worker]") {}

  private format(message: string, args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const base = `${timestamp} ${this.prefix} ${message}`;
    if (args.length === 0) return base;
    return `${base} ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")}`;
  }

  info(message: string, ...args: unknown[]): void {
    console.log(this.format(message, args));
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.format(message, args));
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.format(message, args));
  }
}
