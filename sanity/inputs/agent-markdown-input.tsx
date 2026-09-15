"use client";

import { Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, useToast } from "@sanity/ui";
import * as React from "react";
import { type StringInputProps, set, useFormValue } from "sanity";
import { sanityConfig } from "../config";

type GenerateResponse = {
  text?: string;
  error?: string;
};

function AgentMarkdownInput(props: StringInputProps) {
  const { value, onChange } = props;
  const toast = useToast();

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = React.useState(false);

  const uriRaw = useFormValue(["uri", "current"]);
  const uri = typeof uriRaw === "string" ? uriRaw.trim() : "";

  const runGenerate = async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(sanityConfig.endpoints.generatePageMarkdown, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri }),
      });

      const payload = (await res.json()) as GenerateResponse;

      if (!res.ok || !payload.text) {
        throw new Error(payload.error || "Generation failed.");
      }

      onChange(set(payload.text));
      toast.push({
        status: "success",
        title: "Markdown generated",
        description: "Review it, then publish to serve it to agents.",
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
              Generate from page content
            </Text>
            <Text size={1} muted>
              Builds a token-light Markdown version of this page from its current content. The result lands in the field below as
              an editable draft; nothing is served until you publish.
            </Text>
          </Stack>

          <Flex align="center" gap={3}>
            <Button
              text={isGenerating ? "Generating..." : "Generate"}
              tone="primary"
              disabled={isGenerating || !uri}
              onClick={handleGenerateClick}
            />

            {isGenerating ? (
              <Flex align="center" gap={2}>
                <Spinner muted />
                <Text size={1} muted>
                  Reading this page and writing the Markdown.
                </Text>
              </Flex>
            ) : null}

            {!isGenerating && !uri ? (
              <Text size={1} muted>
                Set this page's URL first to enable.
              </Text>
            ) : null}
          </Flex>
        </Stack>
      </Card>

      {props.renderDefault(props)}

      {showOverwriteConfirm ? (
        <Dialog
          id="agent-markdown-overwrite-confirm"
          header="Replace Markdown?"
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
              This replaces the current Markdown with a freshly generated draft. You can review and edit it before publishing.
            </Text>
          </Box>
        </Dialog>
      ) : null}
    </Stack>
  );
}

export { AgentMarkdownInput };
