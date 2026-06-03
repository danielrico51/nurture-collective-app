import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getServerCredentials } from "@/lib/aws/amplifyCredentials";

const getSesClient = () =>
  new SESClient({
    region: process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || "us-east-1",
    credentials: getServerCredentials(),
  });

export type SendSesEmailInput = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string[];
};

export const sendSesEmail = async (input: SendSesEmailInput): Promise<void> => {
  const client = getSesClient();
  const command = new SendEmailCommand({
    Source: input.from,
    Destination: { ToAddresses: input.to },
    ReplyToAddresses: input.replyTo,
    Message: {
      Subject: { Data: input.subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: input.text, Charset: "UTF-8" },
        ...(input.html ? { Html: { Data: input.html, Charset: "UTF-8" } } : {}),
      },
    },
  });

  await client.send(command);
};
