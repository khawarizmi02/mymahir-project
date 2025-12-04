import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import type { UserRole } from "../generated/prisma/enums.ts";
import prisma from "../PrismaClient.ts";
import { AppError } from "../utils/appError.ts";

interface AuthRequest extends Request {
  user?: { userId: number; email: string; role: UserRole };
}

// Get tenant dashboard data
export const GetTenantDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.userId;

  if (!tenantId) {
    throw new AppError("User not authenticated", 401);
  }

  const now = new Date();

  // Get active tenancy for this tenant (date-based check)
  const activeTenancy = await prisma.tenancy.findFirst({
    where: {
      tenantId,
      leaseStart: { lte: now },
      leaseEnd: { gte: now }
    },
    include: {
      property: {
        include: {
          landlord: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  // Get upcoming tenancies (leaseStart is in the future)
  const upcomingTenancies = await prisma.tenancy.findMany({
    where: {
      tenantId,
      leaseStart: { gt: now }
    },
    include: {
      property: {
        include: {
          landlord: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: { leaseStart: 'asc' }
  });

  // Initialize response data
  let dashboardData: any = {
    metrics: {
      currentRent: 0,
      nextPaymentDue: null,
      leaseEndDate: null,
      openMaintenanceRequests: 0
    },
    property: null,
    recentPayments: [],
    maintenanceRequests: [],
    upcomingTenancies: upcomingTenancies.map(t => ({
      id: t.id,
      propertyId: t.propertyId,
      propertyTitle: t.property.title,
      propertyAddress: t.property.address,
      landlordName: t.property.landlord.name || 'Landlord',
      landlordEmail: t.property.landlord.email,
      monthlyRent: Number(t.monthlyRent),
      leaseStart: t.leaseStart.toISOString(),
      leaseEnd: t.leaseEnd.toISOString()
    }))
  };

  // If active tenancy exists, populate additional data
  if (activeTenancy) {
    // Get recent payments for this tenancy
    const recentPayments = await prisma.payment.findMany({
      where: { tenancyId: activeTenancy.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get maintenance requests for this property
    const maintenanceRequests = await prisma.maintenance.findMany({
      where: {
        propertyId: activeTenancy.propertyId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Count open maintenance requests
    const openMaintenanceCount = await prisma.maintenance.count({
      where: {
        propertyId: activeTenancy.propertyId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    // Calculate next payment due (first of next month)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    dashboardData = {
      ...dashboardData,
      metrics: {
        currentRent: Number(activeTenancy.monthlyRent),
        nextPaymentDue: nextMonth.toISOString(),
        leaseEndDate: activeTenancy.leaseEnd.toISOString(),
        openMaintenanceRequests: openMaintenanceCount
      },
      property: {
        id: activeTenancy.property.id,
        title: activeTenancy.property.title,
        address: activeTenancy.property.address,
        landlordName: activeTenancy.property.landlord.name || 'Landlord',
        landlordEmail: activeTenancy.property.landlord.email,
        monthlyRent: Number(activeTenancy.monthlyRent),
        leaseStart: activeTenancy.leaseStart.toISOString(),
        leaseEnd: activeTenancy.leaseEnd.toISOString()
      },
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString()
      })),
      maintenanceRequests: maintenanceRequests.map(m => ({
        id: m.id,
        propertyId: m.propertyId,
        title: m.title,
        description: m.description,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString()
      }))
    };
  }

  res.json({
    success: true,
    data: dashboardData
  });
});

// Get available properties for browsing
export const GetAvailableProperties = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.userId;

  if (!tenantId) {
    throw new AppError("User not authenticated", 401);
  }

  // Get properties that are marked as available (not currently occupied)
  const properties = await prisma.property.findMany({
    where: {
      // Exclude properties where tenant already has an active or upcoming tenancy
      NOT: {
        tenancies: {
          some: {
            tenantId,
            leaseEnd: { gte: new Date() }
          }
        }
      }
    },
    include: {
      landlord: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  res.json({
    success: true,
    data: properties.map(p => ({
      id: p.id,
      title: p.title,
      address: p.address,
      description: p.description || '',
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      monthlyRent: Number(p.monthlyRent),
      landlordName: p.landlord.name || 'Landlord',
      createdAt: p.createdAt.toISOString()
    }))
  });
});
