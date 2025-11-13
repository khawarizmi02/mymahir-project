import express from "express";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "100mb " }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cors({ credentials: true }));

const PORT = process.env.PORT || 3000;

app.get("/", (_, res) => {
  res.send("Hello");
});

app.listen(PORT, () => console.log(`Server run in http://localhost:${PORT}`));
