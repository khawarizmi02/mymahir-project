import { Router } from "express";

import { authMiddleware } from "../../middleware/authMiddleware";
import {
  CreateTenancy,
  DeleteTenancy,
  GetTenancies,
  GetTenancy,
  UpdateTenancy,
} from "../../controller/tenancy.controller";

// POST /api/v1/tenancies → createTenancy()
// GET /api/v1/tenancies/:id → getTenancyById()
// GET /api/v1/tenancies?landlordId=X&tenantId=Y → filter
// PUT /api/v1/tenancies/:id → updateTenancy()
// DELETE /api/v1/tenancies/:id → deleteTenancy()
// | Create Tenancy routes | Khawa | server/src/router/v1/tenancy.route.ts |
// | Add authorization | Khawa | Only landlord can create/delete tenancies; only landlord/tenant can view theirs |
// | Test with Postman | Khawa | Create tenancy, verify property status changes to OCCUPIED |

const TenancyRoute = Router();

TenancyRoute.post("/", authMiddleware("LANDLORD"), CreateTenancy);
TenancyRoute.get("/:id", authMiddleware("LANDLORD", "TENANT"), GetTenancy);
TenancyRoute.get("/", authMiddleware("LANDLORD"), GetTenancies);
TenancyRoute.put("/:id", authMiddleware("LANDLORD"), UpdateTenancy);
TenancyRoute.delete("/:id", authMiddleware("LANDLORD"), DeleteTenancy);

export default TenancyRoute;
