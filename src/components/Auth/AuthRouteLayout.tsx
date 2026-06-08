"use client";

import { configureAmplify } from "@/utils/amplifyConfig";
import { useEffect } from "react";

const AuthRouteLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <>{children}</>;
};

export default AuthRouteLayout;
