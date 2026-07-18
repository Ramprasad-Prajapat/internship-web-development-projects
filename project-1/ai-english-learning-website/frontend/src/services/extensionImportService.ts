import { DB_KEYS, getCollection, setCollection, uid, nowIso } from "./mockDatabase";
import lessonService from "./lessonService";
import prepositionService from "./prepositionService";
import learningService from "./mockLearningService";
import historyService from "./historyService";
import aiNotebookService from "./aiNotebookService";
import type { ExtensionInboxItem } from "../types/extension.types";
import type { PrepositionType } from "../types/preposition.types";

const SEEDED_KEY = "eng_extension_seeded_v1";

const DEFAULT_ITEMS: Omit<ExtensionInboxItem, "id" | "receivedAt" | "convertedStatus">[] = [
  {
    title: "Vocabulary: 5 Common Verbs in Office Meetings",
    sourceUrl: "https://www.youtube.com/watch?v=meetingverbs",
    rawContent: "1. Schedule (dincharya banana): to plan something at a specific time. Example: Let's schedule the meeting for tomorrow.\n2. Clarify (saaf karna): to make something clear. Example: Can you clarify the goal?\n3. Collaborate (sath kaam karna): to work together. Example: We need to collaborate on this task.\n4. Postpone (aage badhana): to delay to a later time. Example: The meeting is postponed to Monday.\n5. Implement (shuru karna): to start using a plan. Example: We will implement the changes next week.",
    sourceType: "VIDEO",
  },
  {
    title: "Grammar: When to use 'Since' vs 'For'",
    sourceUrl: "https://english.stackexchange.com/q/sincefor",
    rawContent: "Use 'for' to talk about a duration or period of time (length of time):\n- for 2 hours\n- for 3 days\n- for 5 years\n\nUse 'since' to talk about a starting point in time (when it started):\n- since 9 AM\n- since Monday\n- since 2010",
    sourceType: "WEBSITE",
  },
  {
    title: "Preposition AT Rules",
    sourceUrl: "",
    rawContent: "Use 'at' for specific times (at 6 PM, at midnight, at noon).\nUse 'at' for specific points/places (at the bus stop, at the station, at home).",
    sourceType: "CUSTOM",
  }
];

function ensureSeeded(): void {
  if (localStorage.getItem(SEEDED_KEY)) return;
  const items: ExtensionInboxItem[] = DEFAULT_ITEMS.map((item) => ({
    ...item,
    id: uid("ext"),
    receivedAt: nowIso(),
    convertedStatus: "PENDING",
  }));
  setCollection(DB_KEYS.extensionInboxItems, items);
  localStorage.setItem(SEEDED_KEY, "1");
}

async function listItems(): Promise<ExtensionInboxItem[]> {
  ensureSeeded();
  // newest first
  return getCollection<ExtensionInboxItem>(DB_KEYS.extensionInboxItems).sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );
}

async function addItem(input: {
  title: string;
  sourceUrl?: string;
  rawContent: string;
  sourceType: string;
}): Promise<ExtensionInboxItem> {
  ensureSeeded();
  const items = getCollection<ExtensionInboxItem>(DB_KEYS.extensionInboxItems);
  const newItem: ExtensionInboxItem = {
    id: uid("ext"),
    title: input.title.trim(),
    sourceUrl: input.sourceUrl?.trim() || undefined,
    rawContent: input.rawContent.trim(),
    sourceType: input.sourceType,
    receivedAt: nowIso(),
    convertedStatus: "PENDING",
  };
  setCollection(DB_KEYS.extensionInboxItems, [newItem, ...items]);

  // Log in activity history
  await historyService.addEntry({
    type: "EXTENSION_CONTENT_IMPORTED",
    title: `Imported from ${input.sourceType}`,
    description: `Imported "${newItem.title}" into Extension Inbox.`,
    sourceType: "EXTENSION",
    sourceId: newItem.id,
  });

  return newItem;
}

async function deleteItem(id: string): Promise<void> {
  ensureSeeded();
  const items = getCollection<ExtensionInboxItem>(DB_KEYS.extensionInboxItems);
  const found = items.find((item) => item.id === id);
  if (!found) return;

  const nextItems = items.filter((item) => item.id !== id);
  setCollection(DB_KEYS.extensionInboxItems, nextItems);

  // Log in activity history
  await historyService.addEntry({
    type: "EXTENSION_INBOX_ITEM_DELETED",
    title: "Deleted extension import",
    description: `Removed "${found.title}" from Extension Inbox.`,
    sourceType: "EXTENSION",
    sourceId: id,
  });
}

async function clearCompleted(): Promise<void> {
  ensureSeeded();
  const items = getCollection<ExtensionInboxItem>(DB_KEYS.extensionInboxItems);
  const nextItems = items.filter((item) => item.convertedStatus !== "CONVERTED");
  setCollection(DB_KEYS.extensionInboxItems, nextItems);
}

async function convertItem(
  id: string,
  convertAs: ExtensionInboxItem["convertedAs"],
  details: {
    // For Daily Lesson
    weekNumber?: number;
    dayNumber?: number;
    // For Preposition Note
    prepositionType?: PrepositionType;
    // For Vocabulary Word
    word?: string;
    meaning?: string;
    hindiMeaning?: string;
    example?: string;
    // For Grammar/General tags
    tags?: string[];
  }
): Promise<void> {
  ensureSeeded();
  const items = getCollection<ExtensionInboxItem>(DB_KEYS.extensionInboxItems);
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) throw new Error("Inbox item not found.");

  const item = items[idx];
  let targetId = "";

  switch (convertAs) {
    case "DAILY_LESSON": {
      const created = await lessonService.addLesson({
        title: item.title,
        rawContent: item.rawContent,
        topicType: "week-day",
        sourceType: "extension",
        weekNumber: details.weekNumber ?? null,
        dayNumber: details.dayNumber ?? null,
        tags: details.tags ?? ["extension"],
      });
      targetId = created.id;
      break;
    }
    case "PREPOSITION": {
      if (!details.prepositionType) throw new Error("Preposition type required.");
      const created = await prepositionService.addNote(
        details.prepositionType,
        item.rawContent
      );
      targetId = created.id;
      break;
    }
    case "VOCABULARY": {
      if (!details.word) throw new Error("Word is required for vocabulary conversion.");
      const created = await learningService.addVocab({
        word: details.word,
        meaning: details.meaning ?? "",
        hindiMeaning: details.hindiMeaning ?? "",
        example: details.example ?? item.rawContent,
      });
      targetId = created.id;
      break;
    }
    case "GRAMMAR": {
      const created = await lessonService.addLesson({
        title: item.title,
        rawContent: item.rawContent,
        topicType: "grammar",
        sourceType: "extension",
        tags: details.tags ?? ["grammar", "extension"],
      });
      targetId = created.id;
      break;
    }
    case "GENERAL": {
      const created = await lessonService.addLesson({
        title: item.title,
        rawContent: item.rawContent,
        topicType: "other",
        sourceType: "extension",
        tags: details.tags ?? ["general", "extension"],
      });
      targetId = created.id;
      break;
    }
    case "AI_NOTEBOOK": {
      const created = await aiNotebookService.createNote({
        title: item.title,
        sourceType: "Extension Clip",
        originalContent: item.rawContent,
        tags: details.tags ?? ["extension"]
      });
      targetId = created.id;
      break;
    }
    default:
      throw new Error(`Unsupported conversion format: ${convertAs}`);
  }

  // Update item state
  items[idx] = {
    ...item,
    convertedStatus: "CONVERTED",
    convertedAs: convertAs,
    convertedId: targetId,
  };
  setCollection(DB_KEYS.extensionInboxItems, items);

  // Log in activity history
  await historyService.addEntry({
    type: "EXTENSION_CONTENT_CONVERTED",
    title: `Converted inbox content`,
    description: `Converted "${item.title}" to ${convertAs.replace("_", " ")}.`,
    sourceType: "EXTENSION",
    sourceId: id,
    lessonId: convertAs === "DAILY_LESSON" || convertAs === "GRAMMAR" || convertAs === "GENERAL" ? targetId : null,
    dayNumber: convertAs === "DAILY_LESSON" ? (details.dayNumber ?? null) : null,
  });
}

export const extensionImportService = {
  listItems,
  addItem,
  deleteItem,
  clearCompleted,
  convertItem,
};

export default extensionImportService;
