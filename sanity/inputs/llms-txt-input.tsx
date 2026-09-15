"use client";

import { Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, useToast } from "@sanity/ui";
import * as React from "react";
import { type StringInputProps, set, useFormValue } from "sanity";
import { sanityConfig } from "../config";

type GenerateResponse = {
  text?: string;
  error?: string;
};

/**
 * Input for the `llms.content` field: the default textarea plus a button that asks Sanity AI
 * (Agent Actions) to draft a spec-compliant llms.txt from the site's content. Mirrors `SeoImageInput`:
 * call a same-origin API route, then write the result with `onChange(set(...))`.
 *
 * Overwriting existing content asks for confirmation via a Sanity `Dialog` (never a native
 * `window.confirm`); success and failure surface as Sanity toasts.
 */
function LlmsTxtInput(props: StringInputProps) {
  const { value, onChange } = props;
  const toast = useToast();

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = React.useState(false);

  const guidanceRaw = useFormValue(["llms", "guidance"]);
  const guidance = typeof guidanceRaw === "string" ? guidanceRaw.trim() : "";

  const runGenerate = async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(sanityConfig.endpoints.generateLlmsTxt, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guidance }),
      });

      const payload = (await res.json()) as GenerateResponse;

      if (!res.ok || !payload.text) {
        throw new Error(payload.error || "Generation failed.");
      }

      onChange(set(payload.text));
      toast.push({
        status: "success",
        title: "Draft generated",
        description: "Review it, then publish to serve it at /llms.txt.",
      });
    } catch (err) {
      toast.push({
        status: "error",
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Unknown error.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    const hasExistingContent = typeof value === "string" && value.trim().length > 0;

    if (hasExistingContent) {
      setShowOverwriteConfirm(true);
      return;
    }

    void runGenerate();
  };

  const confirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    void runGenerate();
  };

  return (
    <Stack space={3}>
      <Card border padding={3} radius={2} tone="transparent">
        <Stack space={3}>
          <Stack space={2}>
            <Text size={1} weight="medium">
              Generate with Sanity AI
            </Text>
            <Text size={1} muted>
              Drafts an llms.txt from your published pages and articles using Sanity Agent Actions. The result lands in the field
              below as an editable draft, nothing is served until you publish.
            </Text>
          </Stack>

          <Flex align="center" gap={3}>
            <Button
              text={isGenerating ? "Generating..." : "Generate"}
              tone="primary"
              disabled={isGenerating}
              onClick={handleGenerateClick}
            />

            {isGenerating ? (
              <Flex align="center" gap={2}>
                <Spinner muted />
                <Text size={1} muted>
                  Reading your content and writing the file. This can take a moment.
                </Text>
              </Flex>
            ) : null}

            {!isGenerating && guidance ? (
              <Text size={1} muted>
                Using your generation guidance.
              </Text>
            ) : null}
          </Flex>
        </Stack>
      </Card>

      {props.renderDefault(props)}

      {showOverwriteConfirm ? (
        <Dialog
          id="llms-txt-overwrite-confirm"
          header="Replace llms.txt?"
          width={1}
          onClose={() => setShowOverwriteConfirm(false)}
          footer={
            <Flex gap={2} justify="flex-end" padding={2}>
              <Button text="Cancel" mode="ghost" onClick={() => setShowOverwriteConfirm(false)} />
              <Button text="Replace and generate" tone="critical" onClick={confirmOverwrite} />
            </Flex>
          }
        >
          <Box padding={4}>
            <Text size={1}>
              This replaces the current llms.txt with a freshly generated draft. You can review and edit it before publishing.
            </Text>
          </Box>
        </Dialog>
      ) : null}
    </Stack>
  );
}

export { LlmsTxtInput };
