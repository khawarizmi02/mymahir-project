import {
  type TenancyCreateInput,
  type TenancyInclude,
  type TenancyUpdateInput,
  type TenancyWhereInput,
} from "../generated/prisma/models";
import { type Tenancy, PropertyStatus } from "../generated/prisma/client";
import prisma from "../PrismaClient";
import { AppError } from "../utils/appError";
import { logger } from "../middleware/loggers";

// TODO: Integrate Tenancy service
// async createTenancy(data: TenancyCreateInput): Promise<Tenancy>
//   // Validate: tenant exists, property exists, property is VACANT
//   // Create tenancy record
//   // Update property status to OCCUPIED
//   // Return tenancy

// async getTenancyById(id: number): Promise<Tenancy>
// async getTenanciesByLandlord(landlordId: number): Promise<Tenancy[]>
// async getTenanciesByTenant(tenantId: number): Promise<Tenancy[]>
// async updateTenancy(id: number, data: UpdateTenancyDTO): Promise<Tenancy>
// async deleteTenancy(id: number): Promise<void>
//   // Delete tenancy
//   // Update property status back to VACANT

// server/src/services/tenancy.service.ts

/**
 * Create a new tenancy (landlord assigns tenant to property)
 */
export const createTenancy = async (
  data: TenancyCreateInput
): Promise<Tenancy> => {
  try {
    const tenancy = await prisma.tenancy.create({
      data,
      include: {
        property: { include: { images: true } },
        tenant: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
      },
    });

    return tenancy;
  } catch (error) {
    logger.error("createTenancy service error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create tenancy.", 500);
  }
};

/**
 * Get tenancy by ID (with relations)
 */
export const getTenancyById = async (
  id: number,
  include?: TenancyInclude
): Promise<Tenancy> => {
  try {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id },
      include: include ?? {
        property: { include: { images: true } },
        tenant: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
        payments: true,
      },
    });

    if (!tenancy) throw new AppError("Tenancy not found.", 404);

    return tenancy;
  } catch (error) {
    logger.error("getTenancyById service error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch tenancy.", 500);
  }
};

/**
 * Get all tenancies for a landlord
 */
export const getTenanciesByLandlord = async (
  landlordId: number,
  query?: {
    status?: "ACTIVE" | "EXPIRED";
    take?: number | undefined;
    skip?: number | undefined;
  }
): Promise<Tenancy[]> => {
  try {
    const { status, take = 10, skip = 0 } = query ?? {};
    const now = new Date();

    const where: TenancyWhereInput = {
      landlordId,
      ...(status === "ACTIVE" && { leaseEnd: { gte: now } }),
      ...(status === "EXPIRED" && { leaseEnd: { lt: now } }),
    };

    const tenancies = await prisma.tenancy.findMany({
      where,
      include: {
        property: { include: { images: { take: 1 } } },
        tenant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    return tenancies;
  } catch (error) {
    logger.error("getTenanciesByLandlord service error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch tenancies.", 500);
  }
};

/**
 * Get all tenancies for a tenant (current + past)
 */
export const getTenanciesByTenant = async (
  tenantId: number,
  query?: {
    activeOnly?: boolean;
    take?: number | undefined;
    skip?: number | undefined;
  }
): Promise<Tenancy[]> => {
  try {
    const { activeOnly = false, take = 10, skip = 0 } = query ?? {};
    const now = new Date();

    const where: TenancyWhereInput = {
      tenantId,
      ...(activeOnly && { leaseEnd: { gte: now } }),
    };

    const tenancies = await prisma.tenancy.findMany({
      where,
      include: {
        property: { include: { images: { take: 1 } } },
        landlord: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    return tenancies;
  } catch (error) {
    logger.error("getTenanciesByTenant service error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch tenancies.", 500);
  }
};

/**
 * Update tenancy (landlord only)
 */
export const updateTenancy = async (
  id: number,
  data: TenancyUpdateInput
): Promise<Tenancy> => {
  try {
    const updated = await prisma.tenancy.update({
      where: { id },
      data,
      include: {
        property: { include: { images: true } },
        tenant: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  } catch (error) {
    logger.error("updateTenancy service error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update tenancy.", 500);
  }
};

/**
 * Delete tenancy and free up the property
 */
export const deleteTenancy = async (id: number): Promise<void> => {
  try {
    await prisma.tenancy.delete({ where: { id } });
  } catch (error) {
    logger.error("deleteTenancy service error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete tenancy.", 500);
  }
};
