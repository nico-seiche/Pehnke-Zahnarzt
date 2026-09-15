# Contact Form Notifications

This starter can send notification emails for contact form submissions using Resend.

## Behavior

- Form submissions are persisted to Sanity first (`contactFormSubmission`).
- Email notifications are best-effort and non-blocking.
- If email sending fails, submission still succeeds and the error is logged server-side.

## Configuration

Set these environment variables:

```env
RESEND_API_KEY=your-resend-api-key
RESEND_EMAIL_FROM=notifications@your-domain.com
```

Both are optional at runtime. If either is missing, no notification email is sent.

## Recipients in Sanity

Recipients are managed in the Site singleton:

- `site.contactFormNotificationEmails`

For the contact form action, recipients are fetched from `contactFormNotificationEmails`.

## Implementation Notes

- Server action: `features/page-builder/sections/contact-form-section/actions.ts`
- Uses typed query + generated type from `sanity/types.ts`
- Uses `sanityFetch` and `sanityClient` from `~/features/sanity/client`
