import type {
  Maintenance,
  MaintenanceStatus,
} from "../generated/prisma/client";
import type { JsonArray } from "../generated/prisma/internal/prismaNamespace";
import type { MaintenanceCreateInput } from "../generated/prisma/models";
import { logger } from "../middleware/loggers";
import prisma from "../PrismaClient";
import { AppError } from "../utils/appError";

export interface MaintenanceQuery {
  propertyId?: number;
  tenantId?: number;
  status?: MaintenanceStatus;
  search?: string | undefined;
  take?: number | undefined;
  skip?: number | undefined;
}

// async createMaintenanceRequest(data: CreateMaintenanceDTO, tenantId: number): Promise<Maintenance>
//   // Validate: tenant exists, property exists
//   // Create maintenance record with PENDING status
//   // Handle photos array (empty initially, filled on photo upload)
// async getMaintenanceById(id: number): Promise<Maintenance>
// async getMaintenanceByProperty(propertyId: number, query?: MaintenanceQuery): Promise<Maintenance[]>
// async getMaintenanceByTenant(tenantId: number, query?: MaintenanceQuery): Promise<Maintenance[]>
// async updateMaintenanceStatus(id: number, status: MaintenanceStatus): Promise<Maintenance>
// async deleteMaintenanceRequest(id: number): Promise<void>

const createMaintenanceRequest = async (
  data: Omit<MaintenanceCreateInput, "property" | "tenant">,
  tenantId: number,
  propertyId: number
): Promise<Maintenance> => {
  try {
    const maintenance = await prisma.maintenance.create({
      data: {
        ...data,
        tenantId,
        propertyId,
      },
    });
    return maintenance;
  } catch (error) {
    logger.error("CreateMaintenanceRequest error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create maintenance request.", 500);
  }
};
const getMaintenanceByProperty = async (
  propertyId: number,
  query?: Partial<MaintenanceQuery>
): Promise<Maintenance[]> => {
  try {
    const { status, search, take = 10, skip = 0 } = query || {};

    const whereClause: any = {
      propertyId,
      ...(status && { status }),
    };

    // Search in title or description if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const maintenance = await prisma.maintenance.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    if (!maintenance || maintenance.length === 0) {
      throw new AppError(
        "No maintenance requests found for this property.",
        404
      );
    }

    return maintenance;
  } catch (error) {
    logger.error("getMaintenanceByProperty error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch maintenance by property.", 500);
  }
};

const getMaintenanceById = async (id: number): Promise<Maintenance> => {
  try {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!maintenance) throw new AppError("Maintenance not found.", 404);

    return maintenance;
  } catch (error) {
    logger.error("getMaintenanceById error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch maintenance by Id.", 500);
  }
};

const getMaintenanceByTenant = async (
  tenantId: number,
  query?: Partial<MaintenanceQuery>
): Promise<Maintenance[]> => {
  try {
    const { status, search, take = 10, skip = 0 } = query || {};

    const whereClause: any = {
      tenantId,
      ...(status && { status }),
    };

    // Search in title or description if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const maintenance = await prisma.maintenance.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    if (!maintenance || maintenance.length === 0) {
      throw new AppError("No maintenance requests found for this tenant.", 404);
    }

    return maintenance;
  } catch (error) {
    logger.error("getMaintenanceByTenant error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch maintenance by tenant.", 500);
  }
};
const updateMaintenanceStatus = async (
  id: number,
  status: MaintenanceStatus
): Promise<Maintenance> => {
  try {
    // Verify maintenance exists
    const existing = await prisma.maintenance.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Maintenance request not found.", 404);
    }

    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: { status },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!maintenance) {
      throw new AppError("Maintenance status update failed.", 400);
    }

    return maintenance;
  } catch (error) {
    logger.error("updateMaintenanceStatus error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update maintenance status.", 500);
  }
};

const updateMaintPhotos = async (
  id: number,
  urls: JsonArray
): Promise<Maintenance> => {
  try {
    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: { photos: urls },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!maintenance) {
      throw new AppError("Maintenance photo update failed.", 400);
    }

    return maintenance;
  } catch (error) {
    logger.error("deleteMaintenanceRequest error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete maintenance request.", 500);
  }
};
const deleteMaintenanceRequest = async (id: number): Promise<void> => {
  try {
    const deleted = await prisma.maintenance.delete({ where: { id } });

    if (!deleted) {
      throw new AppError("Maintenance deletion failed.", 400);
    }
  } catch (error) {
    logger.error("deleteMaintenanceRequest error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete maintenance request.", 500);
  }
};

export {
  createMaintenanceRequest,
  getMaintenanceByProperty,
  getMaintenanceById,
  getMaintenanceByTenant,
  updateMaintenanceStatus,
  deleteMaintenanceRequest,
  updateMaintPhotos,
};
