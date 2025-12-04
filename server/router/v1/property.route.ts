import { Router } from "express";

import {
  CreateProperty,
  DeleteProperty,
  DeletePropertyImage,
  GetOneProperty,
  GetProperties,
  GetVacantProperties,
  PresignedImageUrl,
  PropertyImage,
  UpdateProperty,
} from "../../controller/property.controller.ts";
import { authMiddleware } from "../../middleware/authMiddleware.ts";

const PropRoute = Router();

/** Basic operation for properties */
PropRoute.get("/vacant", GetVacantProperties);
PropRoute.post("/", authMiddleware("LANDLORD"), CreateProperty);
PropRoute.get("/", authMiddleware("LANDLORD"), GetProperties);
PropRoute.get("/:id", authMiddleware("LANDLORD"), GetOneProperty);
PropRoute.put("/:id", authMiddleware("LANDLORD"), UpdateProperty);
PropRoute.delete("/:id", authMiddleware("LANDLORD"), DeleteProperty);

/** For client to upload image to s3 */
PropRoute.get(
  "/:id/images/presign",
  authMiddleware("LANDLORD"),
  PresignedImageUrl
);

PropRoute.post("/:id/images", authMiddleware("LANDLORD"), PropertyImage);
PropRoute.delete(
  "/:id/images/:imageId",
  authMiddleware("LANDLORD"),
  DeletePropertyImage
);

export default PropRoute;
