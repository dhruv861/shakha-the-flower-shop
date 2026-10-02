// Loads the .env files the way Next.js does, so these scripts use the same
// database and upload folder as the app. Import it before anything else.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
