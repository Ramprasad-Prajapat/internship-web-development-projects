import type { LessonSection } from "../../types/lesson.types";

const EXPECTED_HEADINGS = [
  "Goal / Overview",
  "Time Table",
  "Vocabulary",
  "Grammar",
  "Q&A",
  "Speaking Drill",
  "Mini Conversation",
  "Pronunciation Drill",
  "Common Mistakes",
  "Homework",
  "Self Check",
  "Day Preview"
];

function getCanonicalHeading(text: string): string | null {
  const cleaned = text.replace(/[:：*#]/g, "").trim().toLowerCase();
  
  // Custom mappings for robustness
  if (cleaned.includes("goal") || cleaned.includes("overview")) return "Goal / Overview";
  if (cleaned.includes("time table") || cleaned.includes("timetable") || cleaned.includes("schedule")) return "Time Table";
  if (cleaned.includes("vocab") || cleaned.includes("words")) return "Vocabulary";
  if (cleaned.includes("grammar") || cleaned.includes("rule")) return "Grammar";
  if (cleaned.includes("q&a") || cleaned.includes("questions")) return "Q&A";
  if (cleaned.includes("speaking")) return "Speaking Drill";
  if (cleaned.includes("mini") || cleaned.includes("conversation")) return "Mini Conversation";
  if (cleaned.includes("pronunciation")) return "Pronunciation Drill";
  if (cleaned.includes("mistakes")) return "Common Mistakes";
  if (cleaned.includes("homework")) return "Homework";
  if (cleaned.includes("self check") || cleaned.includes("self-check")) return "Self Check";
  if (cleaned.includes("preview") || cleaned.includes("day preview")) return "Day Preview";

  return null;
}

export function parseDayContent(raw: string): LessonSection[] {
  const lines = raw.split(/\r?\n/);
  const sections: LessonSection[] = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      currentBody.push(line);
      continue;
    }
    
    // Check if line looks like a heading
    const isMdHeading = line.startsWith("#");
    const isBoldHeading = (trimmed.startsWith("**") && trimmed.endsWith("**")) || 
                          (trimmed.startsWith("**") && trimmed.includes("**:") || trimmed.includes("**:"));
                          
    let rawHeadingText = trimmed;
    if (isMdHeading) {
      rawHeadingText = trimmed.replace(/^#+\s*/, "");
    } else if (isBoldHeading) {
      const match = trimmed.match(/^\*\*(.*?)\*\*:?/);
      if (match) {
        rawHeadingText = match[1];
      } else {
        rawHeadingText = trimmed.replace(/^\*\*|\*\*/g, "");
      }
    }
    
    const canonical = getCanonicalHeading(rawHeadingText);

    // If it's a known canonical heading
    if (canonical) {
      // Save previous section if exists (only if it has content, or if there's a heading to preserve empty sections if needed)
      if (currentHeading || currentBody.join("").trim() !== "") {
        sections.push({
          heading: currentHeading || "General Content",
          body: currentBody.join("\n").trim()
        });
      }
      
      currentHeading = canonical;
      currentBody = [];
      // Per instructions: "preserve full original content in saved section data".
      // Let's include the heading line in the body so it's fully preserved.
      currentBody.push(line);
    } else {
      currentBody.push(line);
    }
  }

  // Push the last section
  if (currentHeading || currentBody.length > 0) {
    sections.push({
      heading: currentHeading || "General Content",
      body: currentBody.join("\n").trim()
    });
  }

  return sections.filter(s => s.heading !== "General Content" || s.body !== "");
}

export function serializeSections(sections: LessonSection[]): string {
  return sections
    .map(s => `## ${s.heading}\n${s.body}`)
    .join("\n\n");
}
