// src/components/AuthButtons.tsx
"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import { User, CreditCard, ShoppingBag } from "lucide-react";

export default function AuthButtons() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link
            label="Hồ sơ tài khoản"
            labelIcon={<User size={16} />}
            href="/account"
          />
          <UserButton.Link
            label="Tài khoản & Thẻ ngân hàng"
            labelIcon={<CreditCard size={16} />}
            href="/account/paymentmethods"
          />
          <UserButton.Link
            label="Đơn hàng của tôi"
            labelIcon={<ShoppingBag size={16} />}
            href="/orders"
          />
        </UserButton.MenuItems>
      </UserButton>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignInButton mode="modal">
        <button className="hover:underline cursor-pointer">Đăng nhập</button>
      </SignInButton>
      <span>/</span>
      <SignUpButton mode="modal">
        <button className="hover:underline cursor-pointer">Đăng ký</button>
      </SignUpButton>
    </div>
  );
}