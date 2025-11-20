import { Router } from "express";

import {
  PinRequest,
  PinVerify,
  signIn,
  signUp,
} from "../../controller/auth.controller.ts";

const AuthRoute = Router();

AuthRoute.post("/sign-up", signUp);
AuthRoute.post("/sign-in", signIn);
AuthRoute.get("/pin", PinRequest);
AuthRoute.post("/pin", PinVerify);

export default AuthRoute;
