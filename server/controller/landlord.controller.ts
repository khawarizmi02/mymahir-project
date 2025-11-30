import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import type { UserRole } from "../generated/prisma/enums.ts";
import prisma from "../PrismaClient.ts";
import { AppError } from "../utils/appError.ts";

interface AuthRequest extends Request {
  user?: { userId: number; email: string; role: UserRole };
}

// GET /api/v1/landlord/dashboard
const GetDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "LANDLORD") {
    throw new AppError("Unauthorized: Landlord access only.", 403);
  }

  const landlordId = req.user.userId;

  // Get total properties count
  const totalProperties = await prisma.property.count({
    where: { landlordId },
  });

  // Get occupied properties count
  const occupiedProperties = await prisma.property.count({
    where: { landlordId, status: "OCCUPIED" },
  });

  // Calculate occupancy rate
  const occupancyRate = totalProperties > 0
    ? Math.round((occupiedProperties / totalProperties) * 100)
    : 0;

  // Get landlord's property IDs first
  const landlordProperties = await prisma.property.findMany({
    where: { landlordId },
    select: { id: true },
  });
  const propertyIds = landlordProperties.map((p) => p.id);

  // Get outstanding rent (unpaid payments) - filter by propertyId
  let outstandingRent = "0.00";
  let activeMaintenance = 0;

  if (propertyIds.length > 0) {
    const unpaidPayments = await prisma.payment.aggregate({
      where: {
        propertyId: { in: propertyIds },
        status: "PENDING",
      },
      _sum: { amount: true },
    });
    outstandingRent = unpaidPayments._sum.amount?.toString() || "0.00";

    // Get active maintenance issues count (using Maintenance model)
    activeMaintenance = await prisma.maintenance.count({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });
  }

  // Get urgent tasks
  const urgentTasks: any[] = [];

  if (propertyIds.length > 0) {
    // Pending payments (no dueDate field, so just get pending ones)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "PENDING",
      },
      include: { tenancy: { include: { property: true } } },
      take: 5,
    });

    pendingPayments.forEach((payment) => {
      urgentTasks.push({
        id: payment.id,
        type: "PAYMENT",
        title: "Pending payment - " + (payment.tenancy?.property?.title || "Property"),
        date: payment.createdAt,
        severity: "HIGH",
        routeLink: "/landlord/properties",
      });
    });

    // Pending maintenance
    const pendingMaintenance = await prisma.maintenance.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "PENDING",
      },
      include: { property: true },
      take: 5,
    });

    pendingMaintenance.forEach((request) => {
      urgentTasks.push({
        id: request.id,
        type: "MAINTENANCE",
        title: (request.title || "Maintenance").substring(0, 50) + " - " + request.property.title,
        date: request.createdAt,
        severity: "MEDIUM",
        routeLink: "/landlord/properties",
      });
    });
  }

  res.json({
    success: true,
    message: "Dashboard data fetched successfully.",
    data: {
      metrics: {
        totalProperties,
        occupancyRate,
        outstandingRent,
        activeMaintenance,
      },
      urgentTasks: urgentTasks.slice(0, 10),
    },
  });
});

export { GetDashboard };
