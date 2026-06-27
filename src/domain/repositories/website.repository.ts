import { WebsiteEntity } from "../entities/website.entity";
import { Domain } from "../value-objects/domain";

export interface CreateWebsiteInput {
  website: WebsiteEntity;
  domain: Domain;
}

export interface UpdateWebsiteInput {
  id: string;
  name?: string;
  domain?: string;
  normalizedDomain?: string;
  faviconUrl?: string | null;
  verified?: boolean;
  lastScanAt?: Date | null;
  updatedAt?: Date;
}

export interface DeleteWebsiteInput {
  id: string;
}

export interface FindWebsiteByIdInput {
  id: string;
}

export interface FindByNormalizedDomainInput {
  organizationId: string;
  normalizedDomain: string;
}

export interface FindWebsitesByOrganizationInput {
  organizationId: string;
}

export interface ExistsWebsiteInput {
  organizationId: string;
  normalizedDomain: string;
}

export interface CountWebsitesInput {
  organizationId: string;
}

export interface IWebsiteRepository {
  /** Create a new website. */
  create(input: CreateWebsiteInput): Promise<WebsiteEntity>;

  /** Update an existing website. */
  update(input: UpdateWebsiteInput): Promise<WebsiteEntity>;

  /** Delete a website by ID. */
  delete(input: DeleteWebsiteInput): Promise<void>;

  /** Find a website by its ID. */
  findById(input: FindWebsiteByIdInput): Promise<WebsiteEntity | null>;

  /** Find a website within an organization by its normalized domain. */
  findByNormalizedDomain(
    input: FindByNormalizedDomainInput,
  ): Promise<WebsiteEntity | null>;

  /** List all websites for an organization. */
  findByOrganization(
    input: FindWebsitesByOrganizationInput,
  ): Promise<WebsiteEntity[]>;

  /** Check if a normalized domain already exists in an organization. */
  exists(input: ExistsWebsiteInput): Promise<boolean>;

  /** Count websites in an organization. */
  count(input: CountWebsitesInput): Promise<number>;
}
