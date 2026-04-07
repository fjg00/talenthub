import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { CandidateProfileForm } from "@/components/dashboard/candidate-profile-form";
import { EmployerProfileForm } from "@/components/dashboard/employer-profile-form";
import { AICVParser } from "@/components/dashboard/ai-cv-parser";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "candidate") {
    return (
      <div className="space-y-8">
        <AICVParser />
        <CandidateProfileForm
          profile={profile.candidateProfile}
        />
      </div>
    );
  }

  return (
    <EmployerProfileForm
      profile={profile.employerProfile}
    />
  );
}
