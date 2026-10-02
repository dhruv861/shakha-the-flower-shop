// Loads the .env files the way Next.js does, so these scripts use the same
// database and upload folder as the app. Import it before anything else.
//
// Like `next build` and `next start`, the steps that run with a build or the
// production server read the production files (.env.production.local,
// .env.local, …); everything else reads the development ones, like `next dev`.
// So a local build never migrates the database that .env.development.local
// points at.
import { loadEnvConfig } from "@next/env";

const step = process.env.npm_lifecycle_event ?? "";
const production = process.env.NODE_ENV === "production" || /^(pre)?(build|start)$/.test(step);
loadEnvConfig(process.cwd(), !production);
