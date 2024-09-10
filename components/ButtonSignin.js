"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/libs/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import config from "@/config";

const ButtonSignin = ({ text = "Get started", extraStyle }) => {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (session) {
      setUser(session.user);
    }
  }, [session]);

  const handleClick = async () => {
    if (session) {
      router.push(config.auth.callbackUrl);
    } else {
      // 这里我们使用 Supabase 的 Magic Link 登录
      // 您可能需要创建一个单独的登录页面来处理不同的登录方式
      const { error } = await supabase.auth.signInWithOtp({
        email: prompt("Please enter your email:"),
      });
      if (error) {
        alert("Error sending magic link: " + error.message);
      } else {
        alert("Check your email for the login link!");
      }
    }
  };

  if (loading) {
    return <button className={`btn ${extraStyle ? extraStyle : ""}`}>Loading...</button>;
  }

  if (session) {
    return (
      <Link
        href={config.auth.callbackUrl}
        className={`btn ${extraStyle ? extraStyle : ""}`}
      >
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.email || "Account"}
            className="w-6 h-6 rounded-full shrink-0"
            referrerPolicy="no-referrer"
            width={24}
            height={24}
          />
        ) : (
          <span className="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0">
            {user.email?.charAt(0)}
          </span>
        )}
        {user.email || "Account"}
      </Link>
    );
  }

  return (
    <button
      className={`btn ${extraStyle ? extraStyle : ""}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default ButtonSignin;