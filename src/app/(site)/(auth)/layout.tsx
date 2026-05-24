"use client";

import { configureAmplify } from "@/utils/amplifyConfig";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <>{children}</>;
}
