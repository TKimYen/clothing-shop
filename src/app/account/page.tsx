import { auth } from "@clerk/nextjs/server";
import ProfileForm from "@/src/components/ProfileForm";

export default async function AccountPage() {
  await auth.protect();

  return (
    <main>
      <h1>Thông tin tài khoản</h1>

      <ProfileForm />
    </main>
  );
}