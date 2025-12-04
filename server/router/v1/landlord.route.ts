import { Router } from "express";
import { GetDashboard } from "../../controller/landlord.controller.ts";
import { authMiddleware } from "../../middleware/authMiddleware.ts";

const LandlordRoute = Router();

// Dashboard endpoint
LandlordRoute.get("/dashboard", authMiddleware("LANDLORD"), GetDashboard);

export default LandlordRoute;
