"use server";

import { defineQuery } from "next-sanity";
import { Resend } from "resend";
import { z } from "zod";
import { env } from "~/env";
import { sanityClient, sanityFetch } from "~/features/sanity/client";
import { HONEYPOT_FIELD_NAME } from "~/features/spam-prevention/constants";
import { detectSpam } from "~/features/spam-prevention/utils";
import { API_ONLY_DOCUMENTS, SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";
import type { SiteNotificationEmailsQResult } from "~/sanity/types";

const ContactFormSchema = z.object({
  firstName: z.string().min(1, "Bitte geben Sie Ihren Vornamen ein.").max(100),
  lastName: z.string().min(1, "Bitte geben Sie Ihren Nachnamen ein.").max(100),
  email: z.email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  message: z.string().min(10, "Ihre Nachricht sollte mindestens 10 Zeichen enthalten.").max(1000),
  // Honeypot field - should always be empty for legitimate submissions
  [HONEYPOT_FIELD_NAME]: z.string().optional(),
});

type ContactFormInput = z.infer<typeof ContactFormSchema>;

const FIELD_NAMES = Object.keys(ContactFormSchema.shape).filter((field) => field !== HONEYPOT_FIELD_NAME) as Array<
  Exclude<keyof ContactFormInput, typeof HONEYPOT_FIELD_NAME>
>;

export type ActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<Exclude<keyof ContactFormInput, typeof HONEYPOT_FIELD_NAME>, string>>;
      values?: Partial<Omit<ContactFormInput, typeof HONEYPOT_FIELD_NAME>>;
    };

const SiteNotificationEmailsQ = defineQuery(`*[_type == "${SANITY_SINGLETON_SITE_ID}"][0]{
  contactFormNotificationEmails
}`);

type LegitimateData = Omit<ContactFormInput, typeof HONEYPOT_FIELD_NAME>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendNotification(recipients: string[], subject: string, { firstName, lastName, email, message }: LegitimateData) {
  if (!env.RESEND_API_KEY || !env.RESEND_EMAIL_FROM) {
    return;
  }

  const safeFirstName = escapeHtml(firstName);
  const safeLastName = escapeHtml(lastName);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: env.RESEND_EMAIL_FROM,
    to: recipients,
    subject: escapeHtml(subject),
    html: `
      <p>
        <strong>Name</strong>: ${safeFirstName} ${safeLastName}<br />
        <strong>Email</strong>: ${safeEmail}<br />
        <strong>Message</strong>:<br />
        ${safeMessage}
      </p>
    `,
  });

  if (error) {
    console.error("Resend notification email failed:", error);
  }
}

export async function submitContactForm(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  // First, check for spam
  const spamError = detectSpam(formData);

  if (spamError) {
    return {
      success: false,
      error: spamError,
    };
  }

  // Extract form data (excluding honeypot)
  const input = Object.fromEntries(FIELD_NAMES.map((field) => [field, formData.get(field)])) as Record<
    Exclude<keyof ContactFormInput, typeof HONEYPOT_FIELD_NAME>,
    FormDataEntryValue | null
  >;

  // Add the honeypot field for validation
  const inputWithHoneypot = {
    ...input,
    [HONEYPOT_FIELD_NAME]: formData.get(HONEYPOT_FIELD_NAME),
  };

  const result = ContactFormSchema.safeParse(inputWithHoneypot);

  if (!result.success) {
    const formattedError = z.treeifyError(result.error);

    return {
      success: false,
      error: "",
      fieldErrors: Object.fromEntries(
        FIELD_NAMES.map((field) => [field, formattedError.properties?.[field]?.errors?.[0]])
      ) as Partial<Record<Exclude<keyof ContactFormInput, typeof HONEYPOT_FIELD_NAME>, string>>,
      values: Object.fromEntries(FIELD_NAMES.map((field) => [field, String(input[field] ?? "")])) as Partial<
        Omit<ContactFormInput, typeof HONEYPOT_FIELD_NAME>
      >,
    };
  }

  try {
    // Extract only the legitimate fields (no honeypot)
    const { [HONEYPOT_FIELD_NAME]: _honeypot, ...legitimateData } = result.data;

    await sanityClient
      .withConfig({ token: env.SANITY_API_EDIT_TOKEN })
      .create({ _type: API_ONLY_DOCUMENTS.contactFormSubmission, ...legitimateData }, { autoGenerateArrayKeys: true });

    try {
      const site = await sanityFetch<SiteNotificationEmailsQResult>({
        query: SiteNotificationEmailsQ,
        live: false,
        options: { next: { tags: [SANITY_SINGLETON_SITE_ID] } },
      });

      const recipients = site?.contactFormNotificationEmails?.filter(Boolean) ?? [];

      if (recipients.length > 0) {
        const subject = `Neue Anfrage über das Kontaktformular von ${legitimateData.firstName} ${legitimateData.lastName}`;
        await sendNotification(recipients, subject, legitimateData);
      }
    } catch (error) {
      console.error("Resend notification failed:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to submit contact form:", error);

    return {
      success: false,
      error: "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
    };
  }
}
