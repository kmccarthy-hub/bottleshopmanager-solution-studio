export function stageRepairGuidance(stage, error) {
  if (stage !== "maker") return "";

  const message = error instanceof Error ? error.message : String(error ?? "");
  const blockedToken = message.match(/Blocked token:\s*["']([^"']+)["']/i)?.[1];
  if (!blockedToken) return "";

  if (blockedToken.toLowerCase() === "mailto:") {
    return " Safety rules override any upstream instruction to launch an email client. Do not include the literal mail protocol token anywhere in HTML, CSS, JavaScript, comments or visible status text. Replace it with a type=button control that uses addEventListener to toggle only a generated compose panel, confirmation message or data-state inside the disposable prototype.";
  }

  return ` Safety rules override any conflicting upstream implementation instruction. Remove the blocked token ${JSON.stringify(blockedToken)} and the capability it represents. Replace it with a local type=button interaction that changes only generated prototype elements and data-state values.`;
}
