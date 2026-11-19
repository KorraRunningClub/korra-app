import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Permite usar os recursos do Cloudflare durante o `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
