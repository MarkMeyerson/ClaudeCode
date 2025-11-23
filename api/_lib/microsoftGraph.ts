import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";

// Import the auth provider manually since the package is deprecated
// We'll use a custom auth provider
class TokenProvider {
  private credential: ClientSecretCredential;

  constructor(credential: ClientSecretCredential) {
    this.credential = credential;
  }

  async getAccessToken(): Promise<string> {
    const tokenResponse = await this.credential.getToken([
      "https://graph.microsoft.com/.default"
    ]);
    return tokenResponse?.token || "";
  }
}

/**
 * Create an authenticated Microsoft Graph client
 * Uses client credentials flow (app-only authentication)
 */
export function createGraphClient(): Client {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Azure credentials. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET environment variables."
    );
  }

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  const tokenProvider = new TokenProvider(credential);

  // Create Graph client with custom authentication middleware
  const client = Client.init({
    authProvider: async (done) => {
      try {
        const token = await tokenProvider.getAccessToken();
        done(null, token);
      } catch (error) {
        done(error as Error, null);
      }
    },
  });

  return client;
}

/**
 * Send an email via Microsoft Graph API
 */
export async function sendEmail(params: {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBytes: string; // base64 encoded
  }>;
}): Promise<void> {
  const client = createGraphClient();
  const senderEmail = process.env.M365_SENDER_EMAIL || "info@sherpatech.ai";

  const message: any = {
    message: {
      subject: params.subject,
      body: {
        contentType: "HTML",
        content: params.htmlContent,
      },
      toRecipients: [
        {
          emailAddress: {
            address: params.to.email,
            name: params.to.name || params.to.email,
          },
        },
      ],
    },
  };

  // Add attachments if provided
  if (params.attachments && params.attachments.length > 0) {
    message.message.attachments = params.attachments.map((attachment) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: attachment.name,
      contentType: attachment.contentType,
      contentBytes: attachment.contentBytes,
    }));
  }

  try {
    await client.api(`/users/${senderEmail}/sendMail`).post(message);
  } catch (error: any) {
    console.error("Failed to send email via Microsoft Graph:", error);
    throw new Error(
      `Email sending failed: ${error.message || "Unknown error"}`
    );
  }
}
