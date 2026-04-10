"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  markAsRead,
  markAllAsRead,
} from "@/lib/dal/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await markAsRead(notificationId);
  revalidatePath("/dashboard");
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await markAllAsRead(user.id);
  revalidatePath("/dashboard");
}
