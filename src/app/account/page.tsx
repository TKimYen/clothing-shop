import { auth } from "@clerk/nextjs/server";

export default async function AccountPage() {
  const { userId } = await auth.protect();

  return (
    <main>
      <h1>My Account</h1>
      <p>User ID: {userId}</p>
    </main>
  );
}