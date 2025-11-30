import { Router } from "express";
import { GetTenantDashboard, GetAvailableProperties } from "../../controller/tenant.controller.ts";
import { authMiddleware } from "../../middleware/authMiddleware.ts";

const TenantRoute = Router();

// Dashboard endpoint - requires tenant authentication
TenantRoute.get("/dashboard", authMiddleware("TENANT"), GetTenantDashboard);

// Browse available properties
TenantRoute.get("/properties", authMiddleware("TENANT"), GetAvailableProperties);

export default TenantRoute;
