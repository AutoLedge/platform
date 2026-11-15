import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { usePlaidLink, type PlaidLinkOnExit, type PlaidLinkOnSuccess } from "react-plaid-link";
import type { PlaidActionResult, PlaidIntent } from "@/routes/plaid-actions";

type PlaidLinkButtonProps = {
  /** The business being connected. Callers key the button by it so switching business resets it. */
  businessId: string;
  /** URL of the route whose action runs handlePlaidIntent for this business. */
  actionPath: string;
  label?: string;
  className?: string;
};

const LINK_FAILED = "Couldn't connect to the bank. Try again.";

/**
 * Connects a bank: asks the action for a fresh link token on every click, opens Plaid
 * Link once with it, and posts the public_token back through the same action. Neither
 * token is stored anywhere but in memory.
 */
export default function PlaidLinkButton({
  actionPath,
  label = "Connect a bank",
  className,
}: PlaidLinkButtonProps) {
  // Unkeyed on purpose: its data (and any link token) is dropped when the button unmounts.
  const fetcher = useFetcher<PlaidActionResult>();
  // The link-token result whose Link session has ended (success or exit), so it isn't reopened.
  const [closedResult, setClosedResult] = useState<PlaidActionResult | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const submitting = fetcher.state !== "idle";
  const pendingIntent = submitting ? (fetcher.json as PlaidIntent | undefined)?.intent : undefined;
  const result = fetcher.data;
  const linkToken =
    !submitting && result?.ok && result.intent === "link-token" && result !== closedResult
      ? result.linkToken
      : null;
  const actionError = !submitting && result && !result.ok ? result.error : null;

  const submit = (payload: PlaidIntent) =>
    fetcher.submit(payload, { method: "post", action: actionPath, encType: "application/json" });

  const handleClick = () => {
    setLinkError(null);
    submit({ intent: "link-token" });
  };

  const handleSuccess: PlaidLinkOnSuccess = (publicToken, metadata) => {
    setClosedResult(result ?? null);
    if (!publicToken) {
      setLinkError(LINK_FAILED);
      return;
    }
    const institutionId = metadata.institution?.institution_id;
    submit(
      institutionId
        ? { intent: "connect", public_token: publicToken, institution_id: institutionId }
        : { intent: "connect", public_token: publicToken },
    );
  };

  const handleExit: PlaidLinkOnExit = (error) => {
    setClosedResult(result ?? null);
    // Closing Link without finishing is not an error.
    if (error) setLinkError(LINK_FAILED);
  };

  const busy = submitting || linkToken !== null;
  const buttonLabel =
    pendingIntent === "connect" ? "Connecting…" : busy ? "Opening…" : label;
  const error = busy ? null : (linkError ?? actionError);

  return (
    <div className="plaid-link">
      <button type="button" className={className} onClick={handleClick} disabled={busy}>
        {buttonLabel}
      </button>
      {error && (
        <p className="plaid-link-error" role="alert">
          {error}
        </p>
      )}
      {linkToken && (
        <PlaidLinkLauncher
          key={linkToken}
          token={linkToken}
          onSuccess={handleSuccess}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

type LauncherProps = {
  token: string;
  onSuccess: PlaidLinkOnSuccess;
  onExit: PlaidLinkOnExit;
};

/** Opens Link exactly once for one token. Mounted only while that Link session is live. */
function PlaidLinkLauncher({ token, onSuccess, onExit }: LauncherProps) {
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit });
  const opened = useRef(false); // StrictMode runs effects twice; open Link once

  useEffect(() => {
    if (ready && !opened.current) {
      opened.current = true;
      open();
    }
  }, [ready, open]);

  return null;
}
