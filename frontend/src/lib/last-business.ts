// The business the user last opened, remembered per browser. A convenience only:
// the API's 404 decides access, and a stale id is simply ignored.
const KEY = "autoledge.lastBusinessId";

export function readLastBusinessId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeLastBusinessId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // storage blocked or full: nothing to remember
  }
}
