interface SmsOptions {
  mobile: string;
  message: string;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
}

async function sendMockSms(options: SmsOptions): Promise<SmsResult> {
  console.log("\n📱 ========================");
  console.log("📱 [DEV SMS MOCK]");
  console.log(`📱 To: ${options.mobile}`);
  console.log(`📱 Message: ${options.message}`);
  console.log("📱 ========================\n");
  return { success: true, messageId: `mock_${Date.now()}` };
}

async function sendMsg91Sms(options: SmsOptions): Promise<SmsResult> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || "LNSTRK";
  if (!apiKey) throw new Error("SMS_API_KEY not configured");

  const response = await fetch("https://api.msg91.com/api/v5/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: apiKey },
    body: JSON.stringify({
      template_id: process.env.SMS_TEMPLATE_ID,
      mobile: `91${options.mobile}`,
      otp: options.message,
      sender: senderId,
    }),
  });

  const data = (await response.json()) as { type: string; message: string };
  if (data.type !== "success") throw new Error(data.message);
  return { success: true };
}

export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || "mock";
  if (provider === "mock" || process.env.NODE_ENV === "development") {
    return sendMockSms(options);
  }
  if (provider === "msg91") {
    return sendMsg91Sms(options);
  }
  return sendMockSms(options);
}

export async function sendOtp(mobile: string, otp: string): Promise<SmsResult> {
  return sendSms({
    mobile,
    message: `Your Lenstrack OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
  });
}
