import { Router } from "express";
import {
  GetDashboard,
  UpdateLandlordProfile,
} from "../../controller/landlord.controller.ts";
import { authMiddleware } from "../../middleware/authMiddleware.ts";

const LandlordRoute = Router();

// Dashboard endpoint
LandlordRoute.get("/dashboard", authMiddleware("LANDLORD"), GetDashboard);

// Update landlord profile
LandlordRoute.put(
  "/profile",
  authMiddleware("LANDLORD"),
  UpdateLandlordProfile
);

export default LandlordRoute;
