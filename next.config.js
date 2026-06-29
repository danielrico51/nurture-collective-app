/** @type {import('next').NextConfig} */
const awsSdkExternals = [
  "@aws-sdk/client-s3",
  "@aws-sdk/client-cognito-identity-provider",
  "@aws-sdk/credential-provider-node",
  "@aws-sdk/credential-provider-ini",
  "@aws-sdk/credential-provider-env",
  "@aws-sdk/credential-provider-sso",
  "@aws-sdk/credential-provider-process",
  "@aws-sdk/credential-provider-web-identity",
  "@smithy/core",
  "@smithy/node-config-provider",
];

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["gsap", "split-type"],
  experimental: {
    serverComponentsExternalPackages: awsSdkExternals,
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: "json",
    });

    if (isServer) {
      config.externals = [...(config.externals ?? []), ...awsSdkExternals];
    }

    return config;
  },
};

module.exports = nextConfig;
