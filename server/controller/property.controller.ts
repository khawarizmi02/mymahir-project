import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { s3Service } from "../service/s3.service.ts";
import {
  CreatePropertyService,
  DeletePropertyService,
  GetPropertiesService,
  GetPropertyImageService,
  GetPropertyService,
  GetVacantPropertiesService,
  UpdatePropertyService,
  type PropertyQuery,
} from "../service/property.service.ts";
import { AppError } from "../utils/appError.ts";
import type { UserRole } from "../generated/prisma/enums.ts";
import type {
  PropertyUpdateArgs,
  PropertyUpdateInput,
} from "../generated/prisma/models.ts";
import type { AuthRequest } from "./auth.controller.ts";

// POST /api/v1/properties → createProperty()
// GET /api/v1/properties → getProperties (with filters)
// GET /api/v1/properties/:id → getPropertyById()
// PUT /api/v1/properties/:id → updateProperty()
// DELETE /api/v1/properties/:id → deleteProperty()
// GET /api/v1/properties/vacant → getVacantProperties() // for tenants

// Extract user from req (from auth middleware)
// export interface AuthRequest extends Request {
//   user?: { userId: number; email: string; role: UserRole };
// }

// Create Property (Landlord only)
const CreateProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD") {
    throw new AppError("Unauthorized: Landlord access only.", 403);
  }

  const { userId: landlordId } = req.user;
  const data = { ...req.body, landlordId } as any; // Cast to match service input

  const property = await CreatePropertyService(data);
  res.status(201).json({
    success: true,
    message: "Property created successfully.",
    data: property,
  });
});

// Get All Properties (Landlord: own properties; Tenant: vacant only)
const GetProperties = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query: PropertyQuery = {
    landlordId: req.user?.userId || 0,
    ...(req.query as any), // Parse query params like status, search, etc.
  };

  if (req.user?.role === "TENANT") {
    // For tenants, redirect to vacant query
    const vacantProperties = await GetVacantPropertiesService({ ...query });
    return res.json({
      success: true,
      message: "Vacant properties fetched.",
      data: vacantProperties,
    });
  }

  const properties = await GetPropertiesService(query);
  res.json({ success: true, message: "Properties fetched.", data: properties });
});

// Get Single Property
const GetOneProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ success: false, message: "id is required." });
  const property = await GetPropertyService(parseInt(id));
  res.json({ success: true, message: "Property fetched.", data: property });
});

// Update Property (Landlord only)
const UpdateProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD") {
    throw new AppError("Unauthorized: Landlord access only.", 403);
  }

  const { id } = req.params;
  const { userId: landlordId } = req.user;
  const data = { ...req.body } as PropertyUpdateInput;

  if (!id)
    return res.status(400).json({ success: false, message: "id is required." });

  const property = await UpdatePropertyService(parseInt(id), data, landlordId);
  res.json({
    success: true,
    message: "Property updated successfully.",
    data: property,
  });
});

// Delete Property (Landlord only)
const DeleteProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD") {
    throw new AppError("Unauthorized: Landlord access only.", 403);
  }

  const { id } = req.params;
  const { userId: landlordId } = req.user; // id from JWT

  if (!id)
    return res.status(400).json({ success: false, message: "id is required." });
  await DeletePropertyService(parseInt(id), landlordId);
  res.json({ success: true, message: "Property deleted successfully." });
});

// Get Vacant Properties (Public/Tenant-facing, with optional filters)
const GetVacantProperties = asyncHandler(
  async (req: Request, res: Response) => {
    const { search, minRent, maxRent, take, skip } = req.query;

    const data = await GetVacantPropertiesService({
      search: search as string | undefined,
      minRent: minRent ? Number(minRent) : undefined,
      maxRent: maxRent ? Number(maxRent) : undefined,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });

    res.json({ success: true, message: "Vacant properties fetched.", data });
  }
);

const PresignedImageUrl = asyncHandler(async (req: Request, res: Response) => {
  const { filename, contentType } = req.query as {
    filename: string;
    contentType: string;
  };

  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType required" });
  }

  const { presignedUrl, publicUrl } = await s3Service.generatePresignedUrl(
    filename,
    contentType,
    `properties/${req.params.id}`
  );

  res.json({
    success: true,
    message: "Presigned URL generated.",
    presignedUrl,
    url: publicUrl,
  });
});

const PropertyImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { url, urls } = req.body;
  const id = req.params.id;
  const landlordId = req.user!.userId;

  const imageUrls = Array.isArray(urls) ? urls : url ? [url] : [];

  if (!id || typeof id === undefined) {
    throw new AppError("Valid id URL is required.", 400);
  }

  if (imageUrls.length === 0) {
    throw new AppError("At least one image URL is required.", 400);
  }

  if (
    !imageUrls.every((u) => typeof u === "string" && u.startsWith("https://"))
  ) {
    throw new AppError("All URLs must be valid HTTPS S3 links.", 400);
  }

  if (req.user?.role !== "LANDLORD") {
    throw new AppError("Unauthorized: Landlord access only.", 403);
  }

  const updatedProperty = await UpdatePropertyService(
    parseInt(id),
    {
      images: {
        create: imageUrls.map((url) => ({ url })),
      },
    },
    landlordId
  );

  res.json({
    success: true,
    message: "Image(s) added successfully.",
    data: updatedProperty,
  });
});

const DeletePropertyImage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== "LANDLORD") {
      throw new AppError("Unauthorized: Landlord access only.", 403);
    }

    const propertyId = req.params.id;
    const imageId = req.params.imageId;

    const { userId: landlordId } = req.user;

    if (!propertyId || typeof propertyId === undefined)
      throw new AppError("Property Id is required.", 400);

    if (!imageId || typeof imageId === undefined)
      throw new AppError("Image Id is required.", 400);

    const image = await GetPropertyImageService(parseInt(imageId));

    if (!image || image.propertyId !== parseInt(propertyId)) {
      throw new AppError(
        "Image not found or doesn't belong to this property.",
        404
      );
    }

    const updatedProperty = await UpdatePropertyService(
      parseInt(propertyId),
      {
        images: {
          delete: { id: parseInt(imageId) },
        },
      },
      landlordId
    );

    await s3Service.deleteObject(image.url);

    res.status(200).json({
      success: true,
      message: "Property image deleted successfully.",
      data: updatedProperty,
    });
  }
);

export {
  PresignedImageUrl,
  PropertyImage,
  CreateProperty,
  GetProperties,
  GetOneProperty,
  GetVacantProperties,
  UpdateProperty,
  DeleteProperty,
  DeletePropertyImage,
};
