import type {
  Prisma,
  Property,
  PropertyImage,
  PropertyStatus,
} from "../generated/prisma/client";
import type {
  PropertyCreateInput,
  PropertyUncheckedCreateInput,
  PropertyUpdateInput,
} from "../generated/prisma/models";
import { logger } from "../middleware/loggers";
import prisma from "../PrismaClient";
import { AppError } from "../utils/appError";

export interface PropertyQuery {
  id?: number;
  type?: PropertyStatus;
  landlordId: number;
  status?: PropertyStatus;

  search?: string | undefined;
  minRent?: number | undefined;
  maxRent?: number | undefined;
  take?: number | undefined;
  skip?: number | undefined;
}

const CreatePropertyService = async (
  data: Omit<PropertyUncheckedCreateInput, "id"> & { landlordId: number }
): Promise<Property> => {
  try {
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        address: data.address,
        monthlyRent: data.monthlyRent,
        status: data.status ?? "VACANT",
        landlordId: data.landlordId,
      },
      include: {
        images: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property creation failed.", 400);
    }

    return property;
  } catch (error) {
    logger.error("CreatePropertyService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to create property.", 500);
  }
};

const GetPropertyService = async (id: number): Promise<Property | null> => {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenancies: {
          where: { leaseEnd: { gte: new Date() } }, // Active tenancies only
          include: {
            tenant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found.", 404);
    }

    return property;
  } catch (error) {
    logger.error("GetPropertyService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch property.", 500);
  }
};

const GetPropertiesService = async (
  query: PropertyQuery
): Promise<Property[]> => {
  try {
    const {
      landlordId,
      status,
      search,
      minRent,
      maxRent,
      take = 10,
      skip = 0,
    } = query;

    const whereClause: any = {
      ...(landlordId && { landlordId }),
      ...(status && { status }),
      ...(minRent && { monthlyRent: { gte: minRent } }),
      ...(maxRent && { monthlyRent: { lte: maxRent } }),
    };

    // Search in title or address if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        images: {
          take: 1, // Just the first image for list view
        },
        landlord: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    if (!properties || properties.length === 0) {
      throw new AppError("No properties found.", 404);
    }

    return properties;
  } catch (error) {
    logger.error("GetPropertiesService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch properties.", 500);
  }
};

const UpdatePropertyService = async (
  id: number,
  data: PropertyUpdateInput,
  landlordId: number
): Promise<Property> => {
  try {
    // Verify ownership
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing || existing.landlordId !== landlordId) {
      throw new AppError("Unauthorized: Property not owned by you.", 403);
    }

    const property = await prisma.property.update({
      where: { id },
      data,
      include: {
        images: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property update failed.", 400);
    }

    return property;
  } catch (error) {
    logger.error("UpdatePropertyService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update property.", 500);
  }
};

const DeletePropertyService = async (
  id: number,
  landlordId: number
): Promise<void> => {
  try {
    // Verify ownership
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing || existing.landlordId !== landlordId) {
      throw new AppError("Unauthorized: Property not owned by you.", 403);
    }

    // Soft delete or hard delete? Hard delete with cascade for MVP
    const deleted = await prisma.property.delete({ where: { id } });

    if (!deleted) {
      throw new AppError("Property deletion failed.", 400);
    }
  } catch (error) {
    logger.error("DeletePropertyService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete property.", 500);
  }
};

/**
 * Get list of vacant properties (tenant-facing)
 * @returns Array of vacant properties
 */
const GetVacantPropertiesService = async (
  query?: Partial<PropertyQuery> & {
    take?: number | undefined;
    skip?: number | undefined;
  }
): Promise<Property[]> => {
  try {
    const { search, minRent, maxRent, take = 10, skip = 0 } = query || {};

    // Build the where clause – note the explicit typing of the OR array
    const where: Prisma.PropertyWhereInput = {
      status: "VACANT",

      // price filters
      ...(minRent !== undefined && { monthlyRent: { gte: Number(minRent) } }),
      ...(maxRent !== undefined && { monthlyRent: { lte: Number(maxRent) } }),

      // case-insensitive search on title OR address
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
            } satisfies Prisma.StringFilter,
          },
          {
            address: {
              contains: search,
            } satisfies Prisma.StringFilter,
          },
        ] satisfies Prisma.PropertyWhereInput["OR"],
      }),
    };

    const properties = await prisma.property.findMany({
      where,
      include: {
        images: { take: 3 },
        landlord: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number(take),
      skip: Number(skip),
    });

    if (!properties || properties.length === 0) {
      throw new AppError("No vacant properties found.", 404);
    }

    return properties;
  } catch (error) {
    logger.error("GetVacantPropertiesService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch vacant properties.", 500);
  }
};

const GetPropertyImageService = async (id: number): Promise<PropertyImage> => {
  try {
    const image = await prisma.propertyImage.findUnique({
      where: { id },
    });

    if (!image) throw new AppError("Property image is not existed.", 400);

    return image;
  } catch (error) {
    logger.error("GetPropertyImageService error:", error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to fetch property images.", 500);
  }
};

export {
  CreatePropertyService,
  GetPropertyService,
  GetPropertiesService,
  UpdatePropertyService,
  DeletePropertyService,
  GetVacantPropertiesService,
  GetPropertyImageService,
};
