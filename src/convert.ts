import { marked } from "marked";

import { renderer, extensions } from "./texRenderer";

export function convert(input: string): string {
  marked.use({ renderer, extensions });
  const output = marked.parse(input);
  return output;
}
