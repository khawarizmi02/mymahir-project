// TODO: Integrate Tenancy Controller and Use the Service provided
// POST /api/v1/tenancies → createTenancy()
// GET /api/v1/tenancies/:id → getTenancyById()
// GET /api/v1/tenancies?landlordId=X&tenantId=Y → filter
// PUT /api/v1/tenancies/:id → updateTenancy()
// DELETE /api/v1/tenancies/:id → deleteTenancy()

import type { Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler.ts";
import type { AuthRequest } from "./auth.controller.ts";
import {
  createTenancy,
  getTenancyById,
  getTenanciesByLandlord,
  getTenanciesByTenant,
  updateTenancy,
  deleteTenancy,
} from "../service/tenancy.service.ts";
import { AppError } from "../utils/appError.ts";
import { findUserById } from "../service/user.service.ts";
import {
  GetPropertyService,
  UpdatePropertyService,
} from "../service/property.service.ts";
import { PropertyStatus } from "../generated/prisma/enums.ts";
import type { PropertyUpdateInput } from "../generated/prisma/models.ts";

const CreateTenancy = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD") {
    throw new AppError("Unauthorized: Landlord access only.", 403);
  }

  const { propertyId, tenantId, leaseStart, leaseEnd, monthlyRent } = req.body;
  const landlordId = req.user.userId;

  // Validate tenant exists
  const tenant = await findUserById(tenantId);
  if (!tenant) throw new AppError("Tenant not found.", 404);

  // Validate property exists and belongs to landlord
  const property = await GetPropertyService(propertyId);
  // const property = await prisma.property.findUnique({
  //   where: { id: propertyId },
  // });
  if (!property) throw new AppError("Property not found.", 404);
  if (property.landlordId !== landlordId)
    throw new AppError("You do not own this property.", 403);
  if (property.status !== PropertyStatus.VACANT)
    throw new AppError("Property is already occupied.", 400);

  // Validate dates and rent
  const start = new Date(leaseStart);
  const end = new Date(leaseEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    throw new AppError("Invalid lease dates.", 400);
  if (start >= end)
    throw new AppError("Lease start must be before lease end.", 400);
  if (monthlyRent <= 0)
    throw new AppError("Monthly rent must be greater than 0.", 400);

  const tenancy = await createTenancy({
    property: { connect: { id: propertyId } },
    tenant: { connect: { id: tenantId } },
    landlord: { connect: { id: landlordId } },
    leaseStart: start,
    leaseEnd: end,
    monthlyRent,
  });

  const data = { status: PropertyStatus.OCCUPIED } as PropertyUpdateInput;

  // Update property status
  await UpdatePropertyService(propertyId, data, landlordId);
  // await prisma.property.update({
  //   where: { id: propertyId },
  //   data: { status: PropertyStatus.OCCUPIED },
  // });

  res.status(201).json({
    success: true,
    message: "Tenancy created successfully.",
    data: tenancy,
  });
});

// GET /api/v1/tenancies/:id → getTenancyById()
const GetTenancy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!id) throw new AppError("Id is undefined", 404);
  const tenancyId = parseInt(id);

  const tenancy = await getTenancyById(tenancyId);

  // Security: only landlord or tenant of this tenancy
  if (req.user?.role === "LANDLORD" && tenancy.landlordId !== req.user.userId) {
    throw new AppError("Unauthorized: Not your tenancy.", 403);
  }
  if (req.user?.role === "TENANT" && tenancy.tenantId !== req.user.userId) {
    throw new AppError("Unauthorized: Not your tenancy.", 403);
  }

  res.status(200).json({
    success: true,
    message: "Tenancy fetched successfully.",
    data: tenancy,
  });
});

// GET /api/v1/tenancies?landlordId=X&tenantId=Y → filter
const GetTenancies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { landlordId, tenantId, status, activeOnly, take, skip } = req.query;

  // request from the landlord
  if (req.user?.role === "LANDLORD") {
    const lid = landlordId ? parseInt(landlordId as string) : req.user.userId;
    if (lid !== req.user.userId) {
      throw new AppError(
        "Unauthorized: Cannot view other landlord's tenancies.",
        403
      );
    }

    const tenancies = await getTenanciesByLandlord(lid, {
      status: status as "ACTIVE" | "EXPIRED",
      take: take ? parseInt(take as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Tenancies fetched successfully.",
      data: tenancies,
    });
  }

  // request from the tenant
  if (req.user?.role === "TENANT") {
    const tid = tenantId ? parseInt(tenantId as string) : req.user.userId;
    if (tid !== req.user.userId) {
      throw new AppError(
        "Unauthorized: Cannot view other tenant's tenancies.",
        403
      );
    }

    const tenancies = await getTenanciesByTenant(tid, {
      activeOnly: activeOnly === "true",
      take: take ? parseInt(take as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      message: "Tenancies fetched successfully.",
      data: tenancies,
    });
  }

  throw new AppError("Unauthorized access.", 403);
});

// PUT /api/v1/tenancies/:id → updateTenancy()
const UpdateTenancy = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD")
    throw new AppError("Unauthorized: Landlord access only.", 403);

  const { id } = req.params;
  if (!id) throw new AppError("Id is undefined", 404);
  const tenancyId = parseInt(id);

  const tenancy = await getTenancyById(tenancyId);
  // const tenancy = await prisma.tenancy.findUnique({ where: { id: tenancyId } });
  if (!tenancy) throw new AppError("Tenancy not found.", 404);
  if (tenancy.landlordId !== req.user.userId)
    throw new AppError("Unauthorized: Not your tenancy.", 403);

  const updated = await updateTenancy(tenancyId, req.body);

  res.status(200).json({
    success: true,
    message: "Tenancy updated successfully.",
    data: updated,
  });
});

// DELETE /api/v1/tenancies/:id → deleteTenancy()
const DeleteTenancy = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD")
    throw new AppError("Unauthorized: Landlord access only.", 403);

  const landlordId = req.user.userId;
  const { id } = req.params;
  if (!id) throw new AppError("Id is undefined", 404);
  const tenancyId = parseInt(id);

  const tenancy = await getTenancyById(tenancyId);
  // const tenancy = await prisma.tenancy.findUnique({ where: { id: tenancyId } });
  if (!tenancy) throw new AppError("Tenancy not found.", 404);
  if (tenancy.landlordId !== landlordId)
    throw new AppError("Unauthorized: Not your tenancy.", 403);

  await deleteTenancy(tenancyId);

  const data = { status: PropertyStatus.VACANT } as PropertyUpdateInput;

  // Update property back to VACANT
  await UpdatePropertyService(tenancyId, data, landlordId);
  // await prisma.property.update({
  //   where: { id: tenancy.propertyId },
  //   data: { status: PropertyStatus.VACANT },
  // });

  res.status(200).json({
    success: true,
    message: "Tenancy deleted and property is now vacant.",
    data: null,
  });
});

export {
  CreateTenancy,
  GetTenancy,
  GetTenancies,
  UpdateTenancy,
  DeleteTenancy,
};
