# Spam Prevention

This starter includes a honeypot-based spam prevention system for forms.

## What It Includes

- Hidden honeypot field that bots often fill
- Client-side timing and interaction checks
- Server-side verification as fallback and enforcement

## How It Works

The system combines multiple checks:

1. Honeypot field (`website`) should remain empty
2. Minimum interaction time before submit (2 seconds)
3. Human interaction signals (mouse, keyboard, touch)
4. Server-side validation through `detectSpam`

## Usage

Use the feature from `features/spam-prevention/`:

- `form-honeypot.tsx`: `FormHoneypot` component
- `use-spam-prevention.ts`: `useSpamPrevention` hook
- `utils.ts`: `detectSpam` for server-side validation
- `constants.ts`: configuration values

Typical flow:

1. Render `FormHoneypot` in your form
2. Call `checkSpam` before submit
3. Add metadata via `enhanceFormData`
4. Validate again on the server with `detectSpam`

## What It Blocks

- Bots that fill hidden fields
- Instant submissions
- Submissions without interaction
- Basic bypass attempts that skip client checks

Email capture flows that add contacts to a Resend audience use the same client and server checks.
