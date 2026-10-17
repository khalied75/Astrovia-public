import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin.replace(/\/$/, ""))) return callback(null, true);
      return callback(Object.assign(new Error("Origin is not allowed by CORS."), { status: 403 }));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.json({ name: "Astrovia API", status: "online", version: "1.0.0" });
});
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
