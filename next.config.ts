import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false // 'as any' prepreči TS2353 napako, če se tipi v tvoji verziji razlikujejo
};

export default nextConfig;