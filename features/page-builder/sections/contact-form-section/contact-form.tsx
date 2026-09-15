"use client";

import { useTimeout } from "@mantine/hooks";
import * as React from "react";
import { Button } from "~/components/button";
import { type ActionResult, submitContactForm } from "~/features/page-builder/sections/contact-form-section/actions";
import { FormHoneypot } from "~/features/spam-prevention/form-honeypot";
import { useSpamPrevention } from "~/features/spam-prevention/use-spam-prevention";
import { cx } from "~/features/style/utils";
import { IS_DEV } from "~/features/utils/constants";

const initialState: ActionResult = { success: false as const, error: "", fieldErrors: {} };

const fieldClassName =
  "block w-full rounded-md border border-border-default bg-surface-page px-12 py-10 font-sans text-body text-text-body transition-colors duration-160 ease-out hover:border-brand focus-visible:border-brand disabled:opacity-50";

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};

function FieldShell({ id, label, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <label className="eyebrow text-text-muted" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="font-sans text-caption text-state-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}

type FormInputProps = Omit<React.ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  error?: string;
};

function FormInput({ id, label, error, className, ...props }: FormInputProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cx(fieldClassName, className)}
      />
    </FieldShell>
  );
}

type FormTextareaProps = Omit<React.ComponentProps<"textarea">, "id"> & {
  id: string;
  label: string;
  error?: string;
};

function FormTextarea({ id, label, error, className, ...props }: FormTextareaProps) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <textarea
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cx(fieldClassName, className)}
      />
    </FieldShell>
  );
}

export function ContactForm() {
  const [state, formAction, isPending] = React.useActionState(submitContactForm, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const [spamError, setSpamError] = React.useState<string | null>(null);

  const { checkSpam, enhanceFormData, reset } = useSpamPrevention({
    formRef,
    debug: IS_DEV,
  });

  React.useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      setSpamError(null);
    }
  }, [state.success]);

  // Handle form submission with spam prevention
  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (!formRef.current) {
        return;
      }

      // Check for spam before submission
      const spamCheck = checkSpam(formRef.current);

      if (spamCheck.isSpam) {
        event.preventDefault();
        setSpamError(null);

        if (IS_DEV) {
          console.warn("[Contact Form] Spam detected - submission blocked", {
            reason: spamCheck.reason,
          });
        }

        setSpamError(spamCheck.message);
        return;
      }

      // If not spam, enhance form data with timing metadata before submission
      // The form will submit naturally via the action prop
      const formData = new FormData(formRef.current);
      enhanceFormData(formData);
      setSpamError(null);
    },
    [checkSpam, enhanceFormData]
  );

  const { start: startSuccessReset, clear: clearSuccessReset } = useTimeout(() => {
    setShowSuccess(false);
    formRef.current?.reset();
    reset();
  }, 4000);

  React.useEffect(() => {
    if (showSuccess) {
      startSuccessReset();
      return () => clearSuccessReset();
    }
    clearSuccessReset();
  }, [showSuccess, startSuccessReset, clearSuccessReset]);

  const isDisabled = isPending || showSuccess;
  const values = !state.success ? state.values : undefined;
  const fieldErrors = !state.success ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} onSubmit={handleSubmit} action={formAction} className="flex flex-col gap-24">
      <FormHoneypot />

      <FormInput
        id="firstName"
        name="firstName"
        label="Vorname"
        type="text"
        autoComplete="given-name"
        defaultValue={values?.firstName}
        disabled={isDisabled}
        error={fieldErrors?.firstName}
      />

      <FormInput
        id="lastName"
        name="lastName"
        label="Nachname"
        type="text"
        autoComplete="family-name"
        defaultValue={values?.lastName}
        disabled={isDisabled}
        error={fieldErrors?.lastName}
      />

      <FormInput
        id="email"
        name="email"
        label="E-Mail"
        type="email"
        autoComplete="email"
        defaultValue={values?.email}
        disabled={isDisabled}
        error={fieldErrors?.email}
      />

      <FormTextarea
        id="message"
        name="message"
        label="Ihr Anliegen"
        rows={5}
        defaultValue={values?.message}
        disabled={isDisabled}
        error={fieldErrors?.message}
      />

      <Button type="submit" disabled={isDisabled}>
        {isPending ? "Wird gesendet …" : "Anfrage senden"}
      </Button>

      {showSuccess && (
        <p className="font-sans text-body text-text-body">
          Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet — wir melden uns bei Ihnen.
        </p>
      )}
      {spamError && <p className="font-sans text-caption text-state-danger-fg">{spamError}</p>}
      {!state.success && state.error && !spamError && (
        <p className="font-sans text-caption text-state-danger-fg">{state.error}</p>
      )}
    </form>
  );
}
