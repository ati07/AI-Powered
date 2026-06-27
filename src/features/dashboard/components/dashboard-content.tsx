"use client";

import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { PageContainer } from "@/components/shared/page-container";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardContent() {
  const { stats } = useDashboard();

  return (
    <DashboardLayout>
      <PageContainer
        title="Dashboard"
        description="Overview of your AI Platform operations."
      >
        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        {/* Placeholder card for future content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Activity chart coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Recent actions coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
