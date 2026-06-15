import { classRegistrationConfig } from "@/lib/classRegistrations/config";

export const buildClassRegistrationKey = (registrationId: string): string =>
  `${classRegistrationConfig.s3Prefix}reg_id=${registrationId}/registration.json`;

export const buildClassRegistrationListPrefix = (): string =>
  classRegistrationConfig.s3Prefix;

export const parseClassRegistrationIdFromKey = (key: string): string | null => {
  const match = key.match(
    /class-registrations(?:\/[^/]+)?\/reg_id=([^/]+)\/registration\.json$/
  );
  return match?.[1] ?? null;
};
