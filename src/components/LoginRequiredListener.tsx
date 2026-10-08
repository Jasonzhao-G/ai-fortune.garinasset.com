"use client";

import { useEffect, useState } from "react";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { LOGIN_REQUIRED_EVENT } from "@/lib/client/login-gate";

export default function LoginRequiredListener() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message);
      setOpen(true);
    };
    window.addEventListener(LOGIN_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(LOGIN_REQUIRED_EVENT, handler);
  }, []);

  return <LoginRequiredModal open={open} onClose={() => setOpen(false)} message={message} />;
}
