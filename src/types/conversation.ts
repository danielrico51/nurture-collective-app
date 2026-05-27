import type {
  BudgetPreference,
  ChallengeOption,
  MaternalStage,
  PreferredSchedule,
  SupportInterest,
  Trimester,
} from "@/types/intake";

export type ConversationRole = "user" | "assistant" | "system";

export type EmotionalSignal =
  | "overwhelm"
  | "anxiety"
  | "isolation"
  | "exhaustion"
  | "urgency"
  | "calm"
  | "hopeful"
  | "neutral";

export type ConversationStatus = "active" | "completed";

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: string;
}

/** Live structured profile built during conversation. */
export interface ExtractedMaternalProfile {
  maternalStage: MaternalStage | null;
  dueDate: string | null;
  trimester: Trimester | null;
  postpartumWeeks: number | null;
  postpartumMonths: number | null;
  supportInterests: SupportInterest[];
  challenges: ChallengeOption[];
  challengesFreeText: string;
  emotionalState: EmotionalSignal | null;
  emotionalSignals: EmotionalSignal[];
  insuranceProvider: string;
  insuranceInterested: boolean | null;
  budgetPreference: BudgetPreference | null;
  locationZip: string;
  preferredSchedule: PreferredSchedule;
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  completionScore: number;
  missingFields: string[];
  readyToComplete: boolean;
}

export interface ConversationSession {
  id: string;
  userId: string;
  status: ConversationStatus;
  messages: ConversationMessage[];
  extractedProfile: ExtractedMaternalProfile;
  quickReplies: string[];
  safetyEscalation: boolean;
  createdAt: string;
  updatedAt: string;
  storageKey?: string;
}

export interface ConversationStartResponse {
  session: ConversationSession;
  message: ConversationMessage;
  quickReplies: string[];
}

export interface ConversationMessageResult {
  session: ConversationSession;
  assistantMessage: ConversationMessage;
  quickReplies: string[];
  extractedProfile: ExtractedMaternalProfile;
  intakeSubmitted?: boolean;
}

export const createEmptyExtractedProfile = (
  defaults: Partial<ExtractedMaternalProfile> = {}
): ExtractedMaternalProfile => ({
  maternalStage: null,
  dueDate: null,
  trimester: null,
  postpartumWeeks: null,
  postpartumMonths: null,
  supportInterests: [],
  challenges: [],
  challengesFreeText: "",
  emotionalState: null,
  emotionalSignals: [],
  insuranceProvider: "",
  insuranceInterested: null,
  budgetPreference: null,
  locationZip: "",
  preferredSchedule: {
    days: [],
    times: [],
    modality: "either",
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "America/New_York",
  },
  name: "",
  email: "",
  phone: "",
  smsConsent: false,
  completionScore: 0,
  missingFields: [
    "maternalStage",
    "supportInterests",
    "challenges",
    "locationZip",
    "name",
    "contactInfo",
  ],
  readyToComplete: false,
  ...defaults,
});
