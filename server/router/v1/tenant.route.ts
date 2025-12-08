import { Router } from "express";
import { GetTenantDashboard, GetAvailableProperties, GetTenantTenancies } from "../../controller/tenant.controller.ts";
import { authMiddleware } from "../../middleware/authMiddleware.ts";

const TenantRoute = Router();

// Dashboard endpoint - requires tenant authentication
TenantRoute.get("/dashboard", authMiddleware("TENANT"), GetTenantDashboard);

// Browse available properties
TenantRoute.get("/properties", authMiddleware("TENANT"), GetAvailableProperties);

// Get tenant's tenancies (active and upcoming)
TenantRoute.get("/tenancies", authMiddleware("TENANT"), GetTenantTenancies);

export default TenantRoute;
