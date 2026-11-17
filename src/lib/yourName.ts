const KEY = "progrum-your-name";

export function getYourName(): string {
  try {
    return localStorage.getItem(KEY)?.trim().slice(0, 80) ?? "";
  } catch {
    return "";
  }
}

export function saveYourName(name: string): void {
  try {
    localStorage.setItem(KEY, name.trim().slice(0, 80));
  } catch {
    /* this browser may block localStorage; edits still save without a name */
  }
}
