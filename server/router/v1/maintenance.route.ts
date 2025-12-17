import { Router } from "express";

import { authMiddleware } from "../../middleware/authMiddleware.ts";
import {
  CreateMaintenanceRequest,
  GetMaintenanceById,
  GetMaintenanceByProperty,
  GetMaintenanceByTenant,
  UpdateMaintenanceStatus,
  DeleteMaintenance,
  GetMaintPhotoPreSignedUrl,
  UploadMaintenancePhotos,
  GetMaintenances,
} from "../../controller/maintenance.controller.ts";

const MaintRoutes = Router();

/** Get all maintenance requests (role-based filtering) */
MaintRoutes.get("/", authMiddleware("LANDLORD", "TENANT"), GetMaintenances);

/** Create maintenance request - Tenant only */
MaintRoutes.post("/", authMiddleware("TENANT"), CreateMaintenanceRequest);

/** Get maintenance by ID - Tenant or Landlord */
MaintRoutes.get(
  "/:maintenanceId",
  authMiddleware("LANDLORD", "TENANT"),
  GetMaintenanceById
);

/** Get maintenance by property - Landlord only */
MaintRoutes.get(
  "/property/:propertyId",
  authMiddleware("LANDLORD"),
  GetMaintenanceByProperty
);

/** Get maintenance by tenant - Tenant (own) or Landlord (any) */
MaintRoutes.get(
  "/tenant/:tenantId",
  authMiddleware("TENANT", "LANDLORD"),
  GetMaintenances
);

/** Update maintenance status - Landlord only */
MaintRoutes.put(
  "/:maintenanceId",
  authMiddleware("LANDLORD"),
  UpdateMaintenanceStatus
);

/** Delete maintenance - Landlord only */
MaintRoutes.delete(
  "/:maintenanceId",
  authMiddleware("LANDLORD"),
  DeleteMaintenance
);

/** Get presigned URL for photo upload - Tenant only */
MaintRoutes.get(
  "/:id/photos/presign",
  authMiddleware("TENANT"),
  GetMaintPhotoPreSignedUrl
);

/** Upload maintenance photos - Tenant only */
MaintRoutes.post(
  "/:id/photos",
  authMiddleware("TENANT"),
  UploadMaintenancePhotos
);

export default MaintRoutes;
