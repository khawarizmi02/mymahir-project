import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { s3Service } from "../service/s3.service.ts";
import {
  CreatePropertyService,
  DeletePropertyService,
  GetPropertiesService,
  GetPropertyService,
  GetVacantPropertiesService,
  UpdatePropertyService,
  type PropertyQuery,
} from "../service/property.service.ts";
import { AppError } from "../utils/appError.ts";
import type { UserRole } from "../generated/prisma/enums.ts";
import { success } from "zod";

// POST /api/v1/properties → createProperty()
// GET /api/v1/properties → getProperties (with filters)
// GET /api/v1/properties/:id → getPropertyById()
// PUT /api/v1/properties/:id → updateProperty()
// DELETE /api/v1/properties/:id → deleteProperty()
// GET /api/v1/properties/vacant → getVacantProperties() // for tenants

// Extract user from req (from auth middleware)
interface AuthRequest extends Request {
  user?: { userId: number; email: string; role: UserRole };
}

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
  const data = { ...req.body, landlordId } as any;

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
    const query = { ...(req.query as Partial<PropertyQuery>) }; // e.g., ?search=KL&minRent=1000&take=5
    const data = await GetVacantPropertiesService(query);
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

  res.json({ presignedUrl, url: publicUrl });
});

const PropertyImage = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  // validate user is landlord of this property...
  // then save to PropertyImage table
  // const image = await prisma.propertyImage.create({ data: { propertyId: +req.params.id, url } });
  res.json({ success: true });
});

export {
  PresignedImageUrl,
  PropertyImage,
  CreateProperty,
  GetProperties,
  GetOneProperty,
  GetVacantProperties,
  UpdateProperty,
  DeleteProperty,
};
