"use client";

import { useEffect } from "react";
import VersionBadge from "@/components/ui/VersionBadge";
import { ensureAnonymousUser } from "@/lib/firebase";

export default function ClientBootstrap() {
  useEffect(() => {
    ensureAnonymousUser().catch(() => {});
  }, []);
  return <VersionBadge />;
}


