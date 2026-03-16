import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSharedProfile } from "@/lib/actions/profile";
import { SharedProfileView } from "@/components/shared-profile-view";

interface SharedProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function SharedProfilePage({ params }: SharedProfilePageProps) {
  const { userId: raw } = await params;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) redirect("/");

  const session = await auth();
  if (session?.user) {
    redirect(`/profile/${userId}`);
  }

  const result = await getSharedProfile(userId);
  if (!result.success || !result.data) {
    redirect("/");
  }

  return <SharedProfileView profile={result.data} />;
}
