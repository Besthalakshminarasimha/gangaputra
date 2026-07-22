import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getShrimpRates from "./tools/get-shrimp-rates";
import getFishRates from "./tools/get-fish-rates";
import listMyFarms from "./tools/list-my-farms";
import listMyOrders from "./tools/list-my-orders";
import listMyHealthReports from "./tools/list-my-health-reports";
import scheduleTask from "./tools/schedule-task";
import searchDoctors from "./tools/search-doctors";
import searchHatcheries from "./tools/search-hatcheries";

// Import-safe: read the project ref from Vite's inlined env, never do I/O here.
const projectRef =
  (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "gangaputra-mcp",
  title: "GANGAPUTRA",
  version: "0.1.0",
  instructions:
    "Tools for the GANGAPUTRA aquaculture platform. Use these to fetch daily shrimp/fish market rates across Indian markets, look up doctors and hatcheries, and — when authenticated as a farmer — list the caller's own farms, orders, and health reports, or schedule a task on their calendar.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getShrimpRates,
    getFishRates,
    searchDoctors,
    searchHatcheries,
    listMyFarms,
    listMyOrders,
    listMyHealthReports,
    scheduleTask,
  ],
});
