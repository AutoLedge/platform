// The business being set up, kept per tab until Finish setup creates it.
// A convenience only: nothing here is trusted by the API.
const KEY = "autoledge.onboardingDraft";

export type OnboardingDraft = { name: string };

export function readDraft(): OnboardingDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && "name" in parsed && typeof parsed.name === "string") {
      return { name: parsed.name };
    }
  } catch {
    // blocked storage or malformed JSON: start fresh
  }
  return { name: "" };
}

export function writeDraft(draft: OnboardingDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage blocked: the draft lives only as long as the page
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
