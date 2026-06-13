import {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
} from "@aws-crypto/client-node";

const { decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "info@nesting-place.com";
const FROM_NAME = process.env.RESEND_FROM_NAME || "The Nesting Place";
const REPLY_TO = process.env.RESEND_REPLY_TO || FROM_EMAIL;

const keyring = () =>
  new KmsKeyringNode({
    generatorKeyId: process.env.KEY_ID,
    keyIds: [process.env.KEY_ARN],
  });

const maskEmail = (email) => email.replace(/(^.).*(@.*$)/, "$1***$2");

const buildMessage = (triggerSource, code) => {
  const footer =
    "\n\nIf you didn't request this, you can ignore this email.\n\n— The Nesting Place\nhttps://www.nesting-place.com";

  switch (triggerSource) {
    case "CustomEmailSender_SignUp":
    case "CustomEmailSender_ResendCode":
      return {
        subject: "Your Nesting Place verification code",
        text: `Welcome to The Nesting Place!\n\nYour verification code is: ${code}${footer}`,
        html: `<p>Welcome to <strong>The Nesting Place</strong>!</p><p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px">${code}</p><p>This code expires in 24 hours.</p><p style="color:#666;font-size:14px">If you didn't create an account, you can ignore this email.</p>`,
      };
    case "CustomEmailSender_ForgotPassword":
      return {
        subject: "Reset your Nesting Place password",
        text: `Use this code to reset your password: ${code}${footer}`,
        html: `<p>Use this code to reset your Nesting Place password:</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px">${code}</p>`,
      };
    case "CustomEmailSender_UpdateUserAttribute":
    case "CustomEmailSender_VerifyUserAttribute":
      return {
        subject: "Verify your Nesting Place account",
        text: `Your verification code is: ${code}${footer}`,
        html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px">${code}</p>`,
      };
    case "CustomEmailSender_AdminCreateUser":
      return {
        subject: "Your Nesting Place account",
        text: `Your temporary password is: ${code}${footer}`,
        html: `<p>Your temporary password is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px">${code}</p>`,
      };
    case "CustomEmailSender_Authentication":
      return {
        subject: "Your Nesting Place sign-in code",
        text: `Your sign-in code is: ${code}${footer}`,
        html: `<p>Your sign-in code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px">${code}</p>`,
      };
    case "CustomEmailSender_AccountTakeOverNotification":
      return {
        subject: "Unusual activity on your Nesting Place account",
        text: `We noticed unusual sign-in activity. Verification code: ${code}${footer}`,
        html: `<p>We noticed unusual sign-in activity on your account.</p><p>Verification code: <strong>${code}</strong></p>`,
      };
    default:
      return {
        subject: "Your Nesting Place code",
        text: `Your code is: ${code}${footer}`,
        html: `<p>Your code is: <strong>${code}</strong></p>`,
      };
  }
};

const sendResendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured on the Lambda function");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      text,
      html,
      reply_to: REPLY_TO,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Resend API error (${response.status})`);
  }

  return payload;
};

export const handler = async (event) => {
  console.log("CustomEmailSender trigger:", event.triggerSource);

  const email = event.request?.userAttributes?.email;
  if (!email) {
    throw new Error("Missing recipient email on Cognito custom email sender event");
  }

  let plainTextCode = "";
  if (event.request?.code) {
    const { plaintext } = await decrypt(
      keyring(),
      Buffer.from(event.request.code, "base64")
    );
    plainTextCode = Buffer.from(plaintext).toString("utf-8");
  }

  const message = buildMessage(event.triggerSource, plainTextCode);
  await sendResendEmail({
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  console.log("Sent via Resend to", maskEmail(email), "for", event.triggerSource);
};
