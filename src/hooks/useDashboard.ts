import { useQuery } from "@tanstack/react-query";
import { assetsApi } from "../api/assets";
import { maintenanceApi } from "../api/maintenance";

/** Aggregate data used by the Dashboard screen */
export function useDashboard() {
  const assets = useQuery({
    queryKey: ["dashboard", "assets"],
    queryFn: () => assetsApi.list(),
    staleTime: 2 * 60 * 1000,
  });

  const upcoming = useQuery({
    queryKey: ["dashboard", "upcoming"],
    queryFn: () => maintenanceApi.list({ status: "PENDING" }),
    staleTime: 60 * 1000,
  });

  const inProgress = useQuery({
    queryKey: ["dashboard", "inProgress"],
    queryFn: () => maintenanceApi.list({ status: "IN_PROGRESS" }),
    staleTime: 60 * 1000,
  });

  const critical = useQuery({
    queryKey: ["dashboard", "critical"],
    queryFn: () => maintenanceApi.list({ priority: "CRITICAL" }),
    staleTime: 60 * 1000,
  });

  const isLoading = assets.isLoading || upcoming.isLoading || inProgress.isLoading || critical.isLoading;

  const assetList = assets.data ?? [];
  const upcomingList = upcoming.data ?? [];
  const inProgressList = inProgress.data ?? [];
  const criticalList = critical.data ?? [];

  // Sort upcoming by dueDate ascending (nulls last)
  const sortedUpcoming = [...upcomingList, ...inProgressList].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const refetch = async () => {
    await Promise.all([assets.refetch(), upcoming.refetch(), inProgress.refetch(), critical.refetch()]);
  };

  return {
    isLoading,
    refetch,
    stats: {
      total: assetList.length,
      active: assetList.filter((a) => a.status === "ACTIVE").length,
      underMaintenance: assetList.filter((a) => a.status === "UNDER_MAINTENANCE").length,
      inactive: assetList.filter((a) => a.status === "INACTIVE").length,
    },
    upcoming: sortedUpcoming.slice(0, 10),
    critical: criticalList.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED"),
  };
}
