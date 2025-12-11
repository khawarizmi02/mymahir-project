import { type Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import {
  createMaintenanceRequest,
  getMaintenanceById,
  getMaintenanceByProperty,
  getMaintenanceByTenant,
  updateMaintenanceStatus,
  deleteMaintenanceRequest,
  updateMaintPhotos,
} from "../service/maintenance.service";
import { AppError } from "../utils/appError";
import type { AuthRequest } from "./auth.controller";
import { GetPropertyService } from "../service/property.service";
import { getTenancyByTenantAndLandlord } from "../service/tenancy.service";
import { MaintenanceStatus, UserRole } from "../generated/prisma/enums";
import { s3Service } from "../service/s3.service";

export const CreateMaintenanceRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId: tenantId } = req.user!;
    const { propertyId, title, description } = req.body;

    if (!propertyId) throw new AppError("PropertyId is required.", 400);
    if (!title) throw new AppError("Title is required.", 400);

    // Ensure the property is existed
    const property = await GetPropertyService(parseInt(propertyId));
    if (!property) throw new AppError("Property is not existed.", 404);

    // Ensure user assigned to the property (tenancy)
    const tenancy = await getTenancyByTenantAndLandlord(
      tenantId,
      property.landlordId
    );
    if (!tenancy) throw new AppError("Tenancy is not existed.", 404);

    const maintenance = await createMaintenanceRequest(
      {
        title,
        description: description ?? null,
      },
      tenantId,
      parseInt(propertyId)
    );

    // TODO: Make sure that the landlord can get the email from the server

    res.status(201).json({
      success: true,
      message: "Maintenance request created.",
      data: maintenance,
    });
  }
);

export const GetMaintenanceById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.user!;
    const maintenanceId = req.params.maintenanceId;

    if (!maintenanceId) throw new AppError("Maintenance Id is not found.", 404);

    const maintenance = await getMaintenanceById(parseInt(maintenanceId));

    // Verify maintenance exists
    if (!maintenance) throw new AppError("Maintenance not found.", 404);

    const property = await GetPropertyService(maintenance.propertyId);
    if (!property) throw new AppError("Property is not found.", 404);

    // Ensure user is maintenance related (tenant or landlord)
    if (maintenance.tenantId !== userId && property.landlordId !== userId)
      throw new AppError("Maintenance does not belong to you.", 403);

    res.status(200).json({
      success: true,
      message: "Maintenance request retrieved.",
      data: maintenance,
    });
  }
);

export const GetMaintenanceByProperty = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId: landlordId } = req.user!;
    const propertyId = req.params.propertyId;
    const { status, search, take, skip } = req.query;

    if (!propertyId) throw new AppError("Property Id is not found.", 404);

    // Verify property exists and belongs to landlord
    const property = await GetPropertyService(parseInt(propertyId));
    if (!property) throw new AppError("Property is not found.", 404);

    if (property.landlordId !== landlordId)
      throw new AppError("Unauthorized: Property does not belong to you.", 403);

    const maintenance = await getMaintenanceByProperty(parseInt(propertyId), {
      status: status as any,
      search: search as string | undefined,
      take: take ? parseInt(take as string) : 10,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.status(200).json({
      success: true,
      message: "Maintenance requests retrieved.",
      data: maintenance,
    });
  }
);

export const GetMaintenanceByTenant = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId: tenantId } = req.user!;
    const { status, search, take, skip } = req.query;

    const maintenance = await getMaintenanceByTenant(tenantId, {
      status: status as any,
      search: search as string | undefined,
      take: take ? parseInt(take as string) : 10,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.status(200).json({
      success: true,
      message: "Maintenance requests retrieved.",
      data: maintenance,
    });
  }
);

export const UpdateMaintenanceStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId: landlordId } = req.user!;
    const maintenanceId = req.params.maintenanceId;
    const { status } = req.body;

    if (!maintenanceId) throw new AppError("Maintenance Id is not found.", 404);
    if (!status) throw new AppError("Status is required.", 400);

    // Verify maintenance exists
    const maintenance = await getMaintenanceById(parseInt(maintenanceId));
    if (!maintenance) throw new AppError("Maintenance not found.", 404);

    // Verify property exists and belongs to landlord
    const property = await GetPropertyService(maintenance.propertyId);
    if (!property) throw new AppError("Property is not found.", 404);

    if (property.landlordId !== landlordId)
      throw new AppError(
        "Unauthorized: Maintenance does not belong to your property.",
        403
      );

    const updated = await updateMaintenanceStatus(
      parseInt(maintenanceId),
      status
    );

    res.status(200).json({
      success: true,
      message: "Maintenance status updated.",
      data: updated,
    });
  }
);

export const DeleteMaintenance = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { userId: landlordId } = req.user!;
    const maintenanceId = req.params.maintenanceId;

    if (!maintenanceId) throw new AppError("Maintenance Id is not found.", 404);

    // Verify maintenance exists
    const maintenance = await getMaintenanceById(parseInt(maintenanceId));
    if (!maintenance) throw new AppError("Maintenance not found.", 404);

    // Verify property exists and belongs to landlord
    const property = await GetPropertyService(maintenance.propertyId);
    if (!property) throw new AppError("Property is not found.", 404);

    if (property.landlordId !== landlordId)
      throw new AppError(
        "Unauthorized: Maintenance does not belong to your property.",
        403
      );

    await deleteMaintenanceRequest(parseInt(maintenanceId));

    res.status(200).json({
      success: true,
      message: "Maintenance request deleted.",
    });
  }
);

export const GetMaintPhotoPreSignedUrl = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.TENANT) {
      throw new AppError("Unauthorized: Tenant access only.", 403);
    }

    const { id } = req.params;
    if (!id) throw new AppError("Maintenance ID required.", 400);
    const maintenanceId = parseInt(id);

    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      throw new AppError("Filename and contentType required.", 400);
    }

    const maintenance = await getMaintenanceById(maintenanceId);
    if (!maintenance || maintenance.tenantId !== req.user.userId) {
      throw new AppError(
        "Maintenance not found or does not belong to you.",
        400
      );
    }

    const { presignedUrl, publicUrl } = await s3Service.generatePresignedUrl(
      filename,
      contentType,
      `maintenances/${maintenanceId}`
    );

    res.status(200).json({
      success: true,
      message: "Presigned URL for maintenance photo generated.",
      data: { presignedUrl, publicUrl },
    });
  }
);

export const UploadMaintenancePhotos = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== UserRole.TENANT) {
      throw new AppError("Unauthorized: Tenant access only.", 403);
    }

    const { id } = req.params;
    if (!id) throw new AppError("Maintenance ID required.", 400);
    const maintenanceId = parseInt(id);
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new AppError("Photo URLs array is required.", 400);
    }

    // Validate each photo URL
    const expectedS3Prefix = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/maintenances/${maintenanceId}/`;

    for (const url of urls) {
      if (!url || typeof url !== "string") {
        throw new AppError("Each photo URL must be a valid string.", 400);
      }

      if (!url.startsWith(expectedS3Prefix)) {
        throw new AppError(
          `Photo URL must start with: ${expectedS3Prefix}`,
          400
        );
      }
    }

    const maintenance = await getMaintenanceById(maintenanceId);
    if (
      !maintenance ||
      maintenance.tenantId !== req.user.userId ||
      maintenance.status !== MaintenanceStatus.PENDING
    ) {
      throw new AppError("Invalid maintenance for photo update.", 400);
    }

    const updated = await updateMaintPhotos(maintenanceId, urls);

    res.status(200).json({
      success: true,
      message: "Maintenance photos updated successfully.",
      data: updated,
    });
  }
);
