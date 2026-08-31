import React from "react";
import { DashboardNav } from "@/components";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <DashboardNav lang={lang}>
      {children}
    </DashboardNav>
  );
}


