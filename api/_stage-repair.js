export function stageRepairGuidance(stage, error) {
  if (stage !== "maker") return "";

  const message = error instanceof Error ? error.message : String(error ?? "");
  const cssSelector = message.match(/CSS contains unscoped or baseline selector\s+["']([^"']+)["']/i)?.[1];
  if (cssSelector) {
    return ` The rejected CSS selector was ${JSON.stringify(cssSelector)}. Remove that rule or rewrite each selector in it so it begins with the matching [data-prototype-element="modification-id"] root or a unique .prototype- class. Do not style baseline classes, element names, global roots or the current platform. Preserve the intended visual treatment inside the generated fragment only.`;
  }

  if (/Maker CSS length\s+\d+\s+is outside/i.test(message)) {
    return " Rewrite prototypeCss as a complete, non-empty set of scoped rules between 80 and 12000 characters. Every selector must begin with the matching [data-prototype-element=\"modification-id\"] root or a unique .prototype- class.";
  }

  const unsafeModificationId = message.match(/Maker modification ID\s+(["'][^"']*["'])\s+must be/i)?.[1];
  if (unsafeModificationId) {
    return ` Replace the rejected modification id ${unsafeModificationId} with a unique lowercase kebab-case id between 2 and 64 characters, beginning with a letter. Use that new exact value on the HTML root element's data-prototype-element attribute and in all matching scoped CSS and JavaScript selectors.`;
  }

  const htmlLength = message.match(/Maker modification\s+(["'][^"']+["'])\s+HTML length\s+(\d+)\s+is outside/i);
  if (htmlLength) {
    return ` Rewrite only modification ${htmlLength[1]} as one complete HTML fragment between 80 and 8000 characters. Its first element must carry data-prototype-element equal to the modification id. Keep styling and behaviour in prototypeCss and prototypeScript.`;
  }

  const missingRoot = message.match(/Maker modification\s+(["'][^"']+["'])\s+must begin with one HTML root element/i);
  if (missingRoot) {
    return ` Rewrite modification ${missingRoot[1]} so its html begins immediately with one allowed HTML root element. Put data-prototype-element equal to the modification id on that first element; do not begin with prose, Markdown, CSS or JavaScript.`;
  }

  const missingMarker = message.match(/Maker modification\s+(["'][^"']+["'])\s+must put data-prototype-element=/i);
  if (missingMarker) {
    return ` Add data-prototype-element=${missingMarker[1]} to the first/root element of modification ${missingMarker[1]}. The attribute value must exactly equal the modification id; preserve the feature-specific content and bounded interaction.`;
  }

  const mismatchedMarker = message.match(/Maker modification\s+(["'][^"']+["'])\s+has root data-prototype-element\s+(["'][^"']*["'])/i);
  if (mismatchedMarker) {
    return ` In modification ${mismatchedMarker[1]}, change the root data-prototype-element value from ${mismatchedMarker[2]} to exactly ${mismatchedMarker[1]}. Update matching scoped CSS and JavaScript selectors to use the same corrected value.`;
  }

  const blockedToken = message.match(/Blocked token:\s*["']([^"']+)["']/i)?.[1];
  if (!blockedToken) return "";

  if (blockedToken.toLowerCase() === "mailto:") {
    return " Safety rules override any upstream instruction to launch an email client. Do not include the literal mail protocol token anywhere in HTML, CSS, JavaScript, comments or visible status text. Replace it with a type=button control that uses addEventListener to toggle only a generated compose panel, confirmation message or data-state inside the disposable prototype.";
  }

  if (/^(?:new\s+)?Function\s*\($/.test(blockedToken)) {
    return " Remove the capitalised dynamic code constructor. Preserve the local prototype interaction by rewriting it as an ordinary lowercase function declaration, function expression or arrow function. Do not evaluate generated strings as code.";
  }

  return ` Safety rules override any conflicting upstream implementation instruction. Remove the blocked token ${JSON.stringify(blockedToken)} and the capability it represents. Replace it with a local type=button interaction that changes only generated prototype elements and data-state values.`;
}

export function stageRepairUserMessage(stage, error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (stage !== "maker") return "The agent's draft did not pass its output checks and is being revised.";
  if (/Maker CSS length\s+0\s+is outside/i.test(message)) return "The Maker draft did not include the required scoped styling. Maker is revising the same prototype rather than starting over.";
  if (/Maker CSS length\s+\d+\s+is outside/i.test(message)) return "The Maker draft's scoped styling was incomplete or too large. Maker is revising that styling while preserving the rest of the prototype.";
  if (/CSS contains unscoped or baseline selector/i.test(message)) return "The Maker draft tried to style part of the locked current platform. Maker is restricting the styling to generated prototype elements only.";
  if (/data-prototype-element|modification ID|HTML length|HTML root/i.test(message)) return "One generated page addition did not meet the renderer's isolation contract. Maker is correcting that addition while preserving the valid work.";
  if (/dynamic code execution/i.test(message)) return "The Maker draft used a dynamic code-execution constructor. Maker is rewriting it as an ordinary bounded local function.";
  if (/blocked token|prohibited capability|inline executable/i.test(message)) return "The Maker draft requested a capability that isolated prototypes cannot use. Maker is replacing it with a safe local interaction.";
  return "The Maker draft did not pass a prototype validation check. Maker is revising the same draft while preserving fields that already passed.";
}
