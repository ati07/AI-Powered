import { Domain } from "@/domain/value-objects/domain";

export interface WebsiteEntityProps {
  id: string;
  organizationId: string;
  name: string;
  domain: Domain;
  normalizedDomain: string;
  faviconUrl: string | null;
  verified: boolean;
  lastScanAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WebsiteEntity {
  private readonly props: WebsiteEntityProps;

  constructor(props: CreateWebsiteEntityInput) {
    this.props = {
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  /* ──────────────── Getters ──────────────── */

  get id(): string {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get domain(): Domain {
    return this.props.domain;
  }

  get normalizedDomain(): string {
    return this.props.normalizedDomain;
  }

  get faviconUrl(): string | null {
    return this.props.faviconUrl;
  }

  get verified(): boolean {
    return this.props.verified;
  }

  get lastScanAt(): Date | null {
    return this.props.lastScanAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /* ──────────────── Domain Behavior ──────────────── */

  /**
   * Rename the website. The normalized domain is unaffected.
   */
  rename(newName: string): WebsiteEntity {
    return new WebsiteEntity({
      ...this.props,
      name: newName,
      updatedAt: new Date(),
    });
  }

  /**
   * Change the domain. The domain is normalized again.
   */
  changeDomain(newDomain: Domain): WebsiteEntity {
    return new WebsiteEntity({
      ...this.props,
      domain: newDomain,
      normalizedDomain: newDomain.getValue(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update profile information (favicon, name).
   */
  updateProfile(data: {
    name?: string;
    faviconUrl?: string | null;
  }): WebsiteEntity {
    return new WebsiteEntity({
      ...this.props,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.faviconUrl !== undefined && { faviconUrl: data.faviconUrl }),
      updatedAt: new Date(),
    });
  }

  /**
   * Mark the website as verified.
   */
  verify(): WebsiteEntity {
    return new WebsiteEntity({
      ...this.props,
      verified: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Record a scan timestamp.
   */
  recordScan(): WebsiteEntity {
    return new WebsiteEntity({
      ...this.props,
      lastScanAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export type CreateWebsiteEntityInput = Omit<
  WebsiteEntityProps,
  "createdAt" | "updatedAt"
> & {
  createdAt?: Date;
  updatedAt?: Date;
};
