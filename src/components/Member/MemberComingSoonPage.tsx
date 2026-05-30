"use client";

import { MemberAppPlaceholder } from "@/components/Member/MemberAppPlaceholder";
import {
  getMemberAppById,
  type MemberApp,
} from "@/config/memberApps";
import { notFound } from "next/navigation";

interface MemberComingSoonPageProps {
  appId: MemberApp["id"];
}

export function MemberComingSoonPage({ appId }: MemberComingSoonPageProps) {
  const app = getMemberAppById(appId);
  if (!app || app.status === "available") {
    notFound();
  }
  return <MemberAppPlaceholder app={app} />;
}
