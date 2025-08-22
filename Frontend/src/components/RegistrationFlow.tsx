import { useState } from "react";

interface RegistrationData {
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

interface RegistrationStep {
  id: keyof RegistrationData | "phoneNumber";
  question: string;
  type: "text" | "number" | "select" | "phone";
  placeholder?: string;
  options?:
    | { label: string; value: number }[]
    | { label: string; value: string }[];
}
interface RegistrationFlowProps {
  onComplete: (data: RegistrationData) => void | Promise<void>;
  onBack: () => void;
}

const LOCATION_TO_COUNTRY_CODE = {
  0: 33, // France
  1: 49, // Germany
  2: 34, // Spain
  3: 39, // Italy
  4: 31, // Netherlands
  5: 32, // Belgium
  6: 41, // Switzerland
  7: 43, // Austria
  8: 351, // Portugal
  9: 46, // Sweden
};

const REGISTRATION_STEPS: RegistrationStep[] = [
  {
    id: "location",
    question: "Where are you located?",
    type: "select",
    options: [
      { label: "🇫🇷 France", value: 0 },
      { label: "🇩🇪 Germany", value: 1 },
      { label: "🇪🇸 Spain", value: 2 },
      { label: "🇮🇹 Italy", value: 3 },
      { label: "🇳🇱 Netherlands", value: 4 },
      { label: "🇧🇪 Belgium", value: 5 },
      { label: "🇨🇭 Switzerland", value: 6 },
      { label: "🇦🇹 Austria", value: 7 },
      { label: "🇵🇹 Portugal", value: 8 },
      { label: "🇸🇪 Sweden", value: 9 },
    ],
  },
  {
    id: "phoneNumber",
    question: "What's your phone number?",
    type: "phone",
    placeholder: "Enter your phone number",
  },
  {
    id: "age",
    question: "How old are you?",
    type: "number",
    placeholder: "Enter your age",
  },
  {
    id: "gender",
    question: "What's your gender?",
    type: "select",
    options: [
      { label: "Male", value: 0 },
      { label: "Female", value: 1 },
      { label: "Non-binary", value: 2 },
      { label: "Other", value: 3 },
    ],
  },
  {
    id: "interestedIn",
    question: "Who are you interested in?",
    type: "select",
    options: [
      { label: "Men", value: 0 },
      { label: "Women", value: 1 },
      { label: "Non-binary", value: 2 },
      { label: "Other", value: 3 },
    ],
  },
  {
    id: "preference1",
    question: "What's your favorite movie genre?",
    type: "select",
    options: [
      { label: "Action/Adventure", value: 0 },
      { label: "Romance/Comedy", value: 1 },
      { label: "Horror/Thriller", value: 2 },
      { label: "Drama/Documentary", value: 3 },
      { label: "Sci-Fi/Fantasy", value: 4 },
    ],
  },
  {
    id: "preference2",
    question: "What's your favorite activity?",
    type: "select",
    options: [
      { label: "Outdoor Adventures", value: 0 },
      { label: "Cultural Events", value: 1 },
      { label: "Sports & Fitness", value: 2 },
      { label: "Cooking & Dining", value: 3 },
      { label: "Gaming & Technology", value: 4 },
    ],
  },
  {
    id: "preference3",
    question: "What's your personality type?",
    type: "select",
    options: [
      { label: "Introvert", value: 0 },
      { label: "Extrovert", value: 1 },
      { label: "Ambivert", value: 2 },
    ],
  },
];

export function RegistrationFlow({
  onComplete,
  onBack,
}: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<Partial<RegistrationData>>({});
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Phone number specific state
  const [phoneInput, setPhoneInput] = useState<string>("");

  // Get country code from selected location
  const getCountryCodeFromLocation = (): number => {
    const locationValue = formData.location;
    if (
      locationValue !== undefined &&
      locationValue in LOCATION_TO_COUNTRY_CODE
    ) {
      return LOCATION_TO_COUNTRY_CODE[
        locationValue as keyof typeof LOCATION_TO_COUNTRY_CODE
      ];
    }
    return 33; // Default to France if no location selected
  };

  const currentQuestion = REGISTRATION_STEPS[currentStep];
  const isLastStep = currentStep === REGISTRATION_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const parsePhoneNumber = (countryCode: number, phoneInput: string) => {
    // Remove all non-digit characters
    const digits = phoneInput.replace(/\D/g, "");

    if (!digits) return null;

    // Count leading zeros
    const leadingZeros = digits.match(/^0+/)?.[0]?.length || 0;

    // Get digits without leading zeros
    const phoneDigits = parseInt(digits.replace(/^0+/, "")) || 0;

    return {
      leadingZeros,
      countryCode,
      phoneDigits,
    };
  };

  const validatePhoneNumber = (
    countryCode: number,
    phoneInput: string
  ): boolean => {
    const digits = phoneInput.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15; // Basic length validation
  };

  const handleInputChange = (value: string | number) => {
    if (currentQuestion.id === "phoneNumber") {
      // Handle phone number input separately
      return; // Phone input is handled by setPhoneInput
    }

    setFormData((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    // Special handling for phone number step
    if (currentQuestion.id === "phoneNumber") {
      if (!phoneInput.trim()) {
        alert("Please enter your phone number.");
        return;
      }

      if (!validatePhoneNumber(getCountryCodeFromLocation(), phoneInput)) {
        alert("Please enter a valid phone number (8-15 digits).");
        return;
      }

      const phoneData = parsePhoneNumber(
        getCountryCodeFromLocation(),
        phoneInput
      );
      if (!phoneData) {
        alert("Invalid phone number format.");
        return;
      }

      // Update form data with parsed phone number
      setFormData((prev) => ({
        ...prev,
        leadingZeros: phoneData.leadingZeros,
        countryCode: phoneData.countryCode,
        phoneDigits: phoneData.phoneDigits,
      }));
    } else {
      const currentValue = formData[currentQuestion.id];

      // Validation for other fields
      if (
        currentValue === undefined ||
        currentValue === null ||
        (typeof currentValue === "string" && currentValue === "")
      ) {
        alert("Please answer the question before proceeding.");
        return;
      }

      // Special validation for age
      if (currentQuestion.id === "age" && typeof currentValue === "number") {
        if (currentValue < 18 || currentValue > 100) {
          alert("Age must be between 18 and 100.");
          return;
        }
      }
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    if (isFirstStep) {
      onBack();
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleRegister = async () => {
    // Special handling for phone number step if it's the last step
    if (currentQuestion.id === "phoneNumber") {
      if (!phoneInput.trim()) {
        alert("Please enter your phone number.");
        return;
      }

      const phoneData = parsePhoneNumber(
        getCountryCodeFromLocation(),
        phoneInput
      );
      if (!phoneData) {
        alert("Invalid phone number format.");
        return;
      }

      // Update form data with parsed phone number
      setFormData((prev) => ({
        ...prev,
        leadingZeros: phoneData.leadingZeros,
        countryCode: phoneData.countryCode,
        phoneDigits: phoneData.phoneDigits,
      }));
    } else {
      const currentValue = formData[currentQuestion.id];
      if (
        currentValue === undefined ||
        currentValue === null ||
        (typeof currentValue === "string" && currentValue === "")
      ) {
        alert("Please answer the question before registering.");
        return;
      }
    }

    // Ensure all required fields are present
    const requiredFields: (keyof RegistrationData)[] = [
      "leadingZeros",
      "countryCode",
      "phoneDigits",
      "age",
      "location",
      "gender",
      "interestedIn",
      "preference1",
      "preference2",
      "preference3",
    ];

    const finalFormData = { ...formData };

    // Add phone data if we're on phone step
    if (currentQuestion.id === "phoneNumber") {
      const phoneData = parsePhoneNumber(
        getCountryCodeFromLocation(),
        phoneInput
      );
      if (phoneData) {
        finalFormData.leadingZeros = phoneData.leadingZeros;
        finalFormData.countryCode = phoneData.countryCode;
        finalFormData.phoneDigits = phoneData.phoneDigits;
      }
    }

    const isComplete = requiredFields.every(
      (field) => finalFormData[field] !== undefined
    );

    if (!isComplete) {
      alert("Please complete all registration steps.");
      return;
    }

    setIsRegistering(true);
    try {
      // Mock registration delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: Replace with actual smart contract call
      // The phone data is now split into three fields as required
      console.log("Registration data for smart contract:", finalFormData);
      onComplete(finalFormData as RegistrationData);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const renderInput = () => {
    const value =
      currentQuestion.id !== "phoneNumber"
        ? formData[currentQuestion.id as keyof RegistrationData]
        : undefined;

    switch (currentQuestion.type) {
      case "phone": {
        const currentCountryCode = getCountryCodeFromLocation();
        const locationStep = REGISTRATION_STEPS.find(
          (step) => step.id === "location"
        );
        const selectedLocationOption = locationStep?.options?.find(
          (opt) => opt.value === formData.location
        );

        return (
          <div className="space-y-4">
            {/* Show selected location */}
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
              <p className="text-white/80 text-sm">
                📍 Selected Location:{" "}
                <span className="text-green-300 font-semibold">
                  {selectedLocationOption?.label ||
                    "Please select location first"}
                </span>
              </p>
              <p className="text-white/60 text-xs mt-1">
                Country Code: +{currentCountryCode}
              </p>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Phone Number (without country code)
              </label>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 border border-white/30 rounded-lg px-3 py-3 text-white">
                  +{currentCountryCode}
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="123456789"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-white/50 text-xs mt-2">
                Example: For +{currentCountryCode} 0123456789, enter 0123456789
              </p>
            </div>
          </div>
        );
      }

      case "number":
        return (
          <input
            type="number"
            value={(value as number) || ""}
            onChange={(e) => handleInputChange(parseInt(e.target.value) || 0)}
            placeholder={currentQuestion.placeholder}
            min="18"
            max="100"
            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all"
            autoFocus
          />
        );

      case "select":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange(option.value)}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  value === option.value
                    ? "bg-pink-500 text-white shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">
              Step {currentStep + 1} of {REGISTRATION_STEPS.length}
            </span>
            <span className="text-white/70 text-sm">
              {Math.round(
                ((currentStep + 1) / REGISTRATION_STEPS.length) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${
                  ((currentStep + 1) / REGISTRATION_STEPS.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div
          className={`transition-all duration-300 ${
            isTransitioning
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              {currentQuestion.question}
            </h2>
            {currentQuestion.id === "phoneNumber" && (
              <p className="text-white/70 text-sm">
                📞 Your phone will be encrypted: Leading zeros(
                {formData.leadingZeros || 0}), Country(+
                {getCountryCodeFromLocation()}), Digits(
                {phoneInput
                  ? parsePhoneNumber(getCountryCodeFromLocation(), phoneInput)
                      ?.phoneDigits || 0
                  : 0}
                )
              </p>
            )}
            {currentQuestion.type === "select" && (
              <p className="text-white/70">
                Choose one option that best describes you
              </p>
            )}
          </div>

          <div className="mb-8">{renderInput()}</div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          >
            {isFirstStep ? "← Back to Home" : "← Previous"}
          </button>

          {isLastStep ? (
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegistering ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registering on Blockchain...
                </div>
              ) : (
                "✨ Complete Registration"
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Next →
            </button>
          )}
        </div>

        {/* Data Preview for Development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-black/20 rounded-lg">
            <h3 className="text-white text-sm font-semibold mb-2">
              Debug - Form Data:
            </h3>
            <pre className="text-white/70 text-xs overflow-auto">
              {JSON.stringify(
                {
                  ...formData,
                  ...(currentStep === 1 && phoneInput
                    ? parsePhoneNumber(getCountryCodeFromLocation(), phoneInput)
                    : {}),
                },
                null,
                2
              )}
            </pre>
            {phoneInput && (
              <div className="mt-2 text-white/70 text-xs">
                <p>
                  Phone Preview: +{getCountryCodeFromLocation()} {phoneInput}
                </p>
                <p>
                  Parsed:{" "}
                  {JSON.stringify(
                    parsePhoneNumber(getCountryCodeFromLocation(), phoneInput)
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
