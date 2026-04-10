import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  getNotifications,
  getUnreadCount,
} from "@/lib/dal/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);
  const userName =
    profile?.fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
  const userRole = profile?.role ?? "candidate";

  const [notificationsList, unreadCount] = await Promise.all([
    getNotifications(user.id, 15),
    getUnreadCount(user.id),
  ]);

  return (
    <DashboardShell
      userName={userName}
      userRole={userRole}
      notifications={notificationsList}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
