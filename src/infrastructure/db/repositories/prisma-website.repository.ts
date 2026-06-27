import { prisma } from "@/infrastructure/db/prisma";
import { type IWebsiteRepository } from "@/domain/repositories/website.repository";
import {
  WebsiteEntity,
  type CreateWebsiteEntityInput,
} from "@/domain/entities/website.entity";
import { Domain } from "@/domain/value-objects/domain";
import type {
  CreateWebsiteInput,
  UpdateWebsiteInput,
  DeleteWebsiteInput,
  FindWebsiteByIdInput,
  FindByNormalizedDomainInput,
  FindWebsitesByOrganizationInput,
  ExistsWebsiteInput,
  CountWebsitesInput,
} from "@/domain/repositories/website.repository";
import { NotFoundError } from "@/application/common/errors";

/* ──────────────── Mapper ──────────────── */

function toDomain(dbWebsite: {
  id: string;
  organizationId: string;
  name: string;
  domain: string;
  normalizedDomain: string;
  faviconUrl: string | null;
  verified: boolean;
  lastScanAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WebsiteEntity {
  const input: CreateWebsiteEntityInput = {
    id: dbWebsite.id,
    organizationId: dbWebsite.organizationId,
    name: dbWebsite.name,
    domain: Domain.unsafeCreate(dbWebsite.normalizedDomain),
    normalizedDomain: dbWebsite.normalizedDomain,
    faviconUrl: dbWebsite.faviconUrl,
    verified: dbWebsite.verified,
    lastScanAt: dbWebsite.lastScanAt,
    createdAt: dbWebsite.createdAt,
    updatedAt: dbWebsite.updatedAt,
  };
  return new WebsiteEntity(input);
}

/* ──────────────── Repository ──────────────── */

export class PrismaWebsiteRepository implements IWebsiteRepository {
  async create(input: CreateWebsiteInput): Promise<WebsiteEntity> {
    const saved = await prisma.website.create({
      data: {
        id: input.website.id,
        organizationId: input.website.organizationId,
        name: input.website.name,
        domain: input.domain.getOriginalValue(),
        normalizedDomain: input.website.normalizedDomain,
        faviconUrl: input.website.faviconUrl,
        verified: input.website.verified,
        lastScanAt: input.website.lastScanAt,
        createdAt: input.website.createdAt,
        updatedAt: input.website.updatedAt,
      },
    });

    return toDomain(saved);
  }

  async update(input: UpdateWebsiteInput): Promise<WebsiteEntity> {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.domain !== undefined) data.domain = input.domain;
    if (input.normalizedDomain !== undefined)
      data.normalizedDomain = input.normalizedDomain;
    if (input.faviconUrl !== undefined) data.faviconUrl = input.faviconUrl;
    if (input.verified !== undefined) data.verified = input.verified;
    if (input.lastScanAt !== undefined) data.lastScanAt = input.lastScanAt;
    if (input.updatedAt !== undefined) data.updatedAt = input.updatedAt;

    try {
      const saved = await prisma.website.update({
        where: { id: input.id },
        data,
      });

      return toDomain(saved);
    } catch {
      throw new NotFoundError("Website", input.id);
    }
  }

  async delete(input: DeleteWebsiteInput): Promise<void> {
    try {
      await prisma.website.delete({
        where: { id: input.id },
      });
    } catch {
      throw new NotFoundError("Website", input.id);
    }
  }

  async findById(input: FindWebsiteByIdInput): Promise<WebsiteEntity | null> {
    const website = await prisma.website.findUnique({
      where: { id: input.id },
    });

    return website ? toDomain(website) : null;
  }

  async findByNormalizedDomain(
    input: FindByNormalizedDomainInput,
  ): Promise<WebsiteEntity | null> {
    const website = await prisma.website.findFirst({
      where: {
        organizationId: input.organizationId,
        normalizedDomain: input.normalizedDomain,
      },
    });

    return website ? toDomain(website) : null;
  }

  async findByOrganization(
    input: FindWebsitesByOrganizationInput,
  ): Promise<WebsiteEntity[]> {
    const websites = await prisma.website.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: "desc" },
    });

    return websites.map(toDomain);
  }

  async exists(input: ExistsWebsiteInput): Promise<boolean> {
    const count = await prisma.website.count({
      where: {
        organizationId: input.organizationId,
        normalizedDomain: input.normalizedDomain,
      },
    });

    return count > 0;
  }

  async count(input: CountWebsitesInput): Promise<number> {
    return prisma.website.count({
      where: { organizationId: input.organizationId },
    });
  }
}
