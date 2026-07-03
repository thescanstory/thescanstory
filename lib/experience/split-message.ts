const GENERIC_HEADING = "A Story For You";
const MAX_HEADING_LENGTH = 60;

// A short first line becomes the heading (recipient name, e.g. "Arav &
// Arya"); everything else is the message body. Falls back to a generic
// heading when the message doesn't start with something heading-shaped.
export function splitMessage(message: string) {
  const breakIndex = message.indexOf("\n");
  if (breakIndex === -1) {
    return message.length <= MAX_HEADING_LENGTH
      ? { heading: message, body: "" }
      : { heading: GENERIC_HEADING, body: message };
  }
  const firstLine = message.slice(0, breakIndex).trim();
  const rest = message.slice(breakIndex).trim();
  return firstLine.length > 0 && firstLine.length <= MAX_HEADING_LENGTH
    ? { heading: firstLine, body: rest }
    : { heading: GENERIC_HEADING, body: message };
}
