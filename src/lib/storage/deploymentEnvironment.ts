export type DeploymentEnvironment = "local" | "dev" | "prod";

const PROD_BRANCHES = new Set(["main", "master", "production", "prod"]);

type EnvSource = Partial<NodeJS.ProcessEnv> &
  Partial<
    Record<
      | "APP_ENV"
      | "NURTURE_DEPLOYMENT_ENV"
      | "AMPLIFY_BRANCH"
      | "AWS_BRANCH"
      | "VERCEL_GIT_COMMIT_REF",
      string | undefined
    >
  >;

/** Resolves whether this deployment should read/write prod or isolated dev storage. */
export const resolveDeploymentEnvironment = (
  env: EnvSource = process.env
): DeploymentEnvironment => {
  const explicit =
    env.APP_ENV?.trim().toLowerCase() ||
    env.NURTURE_DEPLOYMENT_ENV?.trim().toLowerCase();

  if (explicit === "prod" || explicit === "production") return "prod";
  if (explicit === "dev" || explicit === "development") return "dev";
  if (explicit === "local") return "local";

  const branch = (
    env.AMPLIFY_BRANCH || env.AWS_BRANCH || env.VERCEL_GIT_COMMIT_REF || ""
  )
    .trim()
    .toLowerCase();

  if (branch) {
    return PROD_BRANCHES.has(branch) ? "prod" : "dev";
  }

  if (env.NODE_ENV === "production") return "prod";
  return "local";
};
