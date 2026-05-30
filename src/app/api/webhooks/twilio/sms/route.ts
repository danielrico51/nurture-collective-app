import { NextRequest } from "next/server";
import { twilioConfig, isTwilioSmsConciergeEnabled } from "@/config/twilio";
import { handleInboundSms } from "@/lib/conversation/smsConcierge";
import { validateTwilioSignature } from "@/lib/integrations/twilio/signature";
import {
  buildTwimlEmptyResponse,
  buildTwimlMessageResponse,
} from "@/lib/integrations/twilio/twiml";

export const dynamic = "force-dynamic";

const parseFormParams = async (
  request: NextRequest
): Promise<Record<string, string>> => {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
};

const resolveWebhookUrl = (request: NextRequest): string => {
  if (twilioConfig.smsWebhookUrl) {
    return twilioConfig.smsWebhookUrl;
  }
  return request.url.split("?")[0] ?? request.url;
};

export async function POST(request: NextRequest) {
  if (!isTwilioSmsConciergeEnabled()) {
    return new Response("SMS concierge not configured", { status: 503 });
  }

  let params: Record<string, string>;
  try {
    params = await parseFormParams(request);
  } catch {
    return new Response("Invalid form body", { status: 400 });
  }

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const webhookUrl = resolveWebhookUrl(request);

  if (!twilioConfig.skipSignatureValidation) {
    const valid = validateTwilioSignature(
      twilioConfig.authToken,
      signature,
      webhookUrl,
      params
    );
    if (!valid) {
      console.warn("[twilio/sms] invalid webhook signature", { webhookUrl });
      return new Response("Forbidden", { status: 403 });
    }
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";

  try {
    const result = await handleInboundSms({
      from,
      body,
      messageSid: params.MessageSid,
    });

    if (result.skipped || !result.reply.trim()) {
      return new Response(buildTwimlEmptyResponse(), {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    return new Response(buildTwimlMessageResponse(result.reply), {
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("[twilio/sms] handler failed:", error);
    return new Response(
      buildTwimlMessageResponse(
        "Sorry — we're having trouble right now. Please try again in a moment or call (844) 926-2867."
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      }
    );
  }
}
