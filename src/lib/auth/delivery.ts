/** 验证码下发（配置短信/邮件后生效；否则为演示模式） */
export async function deliverOtpCode(params: {
  method: "phone" | "email";
  account: string;
  code: string;
  purpose: string;
}): Promise<{ delivered: boolean; mode: "sms" | "email" | "demo" }> {
  const { method, account, code } = params;

  if (method === "email" && process.env.RESEND_API_KEY?.trim()) {
    const from = process.env.AUTH_EMAIL_FROM?.trim() || "onboarding@resend.dev";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: account,
        subject: "AI 灵宠 验证码",
        text: `您的验证码为 ${code}，5 分钟内有效。如非本人操作请忽略。`,
      }),
    });
    if (res.ok) return { delivered: true, mode: "email" };
  }

  if (method === "phone" && process.env.AUTH_SMS_HOOK_URL?.trim()) {
    const res = await fetch(process.env.AUTH_SMS_HOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: account, code, template: "otp" }),
    });
    if (res.ok) return { delivered: true, mode: "sms" };
  }

  return { delivered: false, mode: "demo" };
}

export function shouldExposeDemoCode(): boolean {
  return (
    process.env.AUTH_OTP_EXPOSE_DEMO === "true" ||
    process.env.NODE_ENV === "development"
  );
}
