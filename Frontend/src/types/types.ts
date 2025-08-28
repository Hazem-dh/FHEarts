export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export interface RegistrationData {
  leadingZeros: number; // euint8 - Count of leading zeros
  countryCode: number; // euint8 - Country code as number
  phoneDigits: number; // euint64 - Phone digits without leading zeros
  age: number;
  location: number; // City/region code
  gender: number; // 0 for male, 1 for female, 2 for non-binary, 3 for other
  interestedIn: number; // 0 for male, 1 for female, 2 for non-binary, 3 for other
  preference1: number; // Movie type (0-4)
  preference2: number; // Activity (0-4)
  preference3: number; // Personality type (0-2)
}

export interface RegistrationStep {
  id: keyof RegistrationData | "phoneNumber";
  question: string;
  type: "text" | "number" | "select" | "phone";
  placeholder?: string;
  options?:
    | { label: string; value: number }[]
    | { label: string; value: string }[];
}

export interface RegistrationFlowProps {
  onComplete: (data: RegistrationData) => void | Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean; // Add this prop to track submission state from parent
}

export interface RegistrationData {
  leadingZeros: number;
  countryCode: number;
  phoneDigits: number;
  age: number;
  location: number;
  gender: number;
  interestedIn: number;
  preference1: number;
  preference2: number;
  preference3: number;
}

export interface MatchData {
  address: string;
  hasMatch: boolean;
  matchScore?: number;
  matchIndex?: string;
  isMutual: boolean;
  hasPhoneConsent: boolean;
  phoneNumber?: string;
  countryCode?: number;
  leadingZero?: number;
}

export interface PendingMatch {
  id: number;
  address: string;
}

export interface ProfileData {
  phoneNumber: string;
  countryCode: number;
  leadingZeros: number;
  phoneDigits: number;
  age: number;
  location: number;
  gender: number;
  interestedIn: number;
  preference1: number;
  preference2: number;
  preference3: number;
  isActive: boolean;
}

export type ProfileContractResult = readonly [
  string, // userAddress
  bigint, // countryCode (euint8)
  bigint, // leadingZero (euint8)
  bigint, // encryptedPhoneNumber (euint64)
  bigint, // age (euint8)
  bigint, // location (euint8)
  bigint, // gender (euint8)
  bigint, // interestedIn (euint8)
  bigint, // preference1 (euint8)
  bigint, // preference2 (euint8)
  bigint, // preference3 (euint8)
  boolean // isActive
];
