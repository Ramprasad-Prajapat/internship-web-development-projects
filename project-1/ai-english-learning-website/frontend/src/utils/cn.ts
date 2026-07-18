// Tiny className combiner (no external dependency).
// Filters out false / null / undefined and joins the rest with a space.
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export default cn;
