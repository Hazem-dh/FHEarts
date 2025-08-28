import { useState } from "react";
import {
  type RegistrationData,
  type RegistrationStep,
  type RegistrationFlowProps,
} from "../types/types";

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
  isSubmitting = false, // Default to false if not provided
}: RegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<Partial<RegistrationData>>({});
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

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
    // Don't allow navigation while submitting
    if (isSubmitting) return;

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
    // Don't allow navigation while submitting
    if (isSubmitting) return;

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

    // Call the parent's onComplete function
    // The parent will handle the loading state and toast notifications
    console.log("Registration data for smart contract:", finalFormData);
    await onComplete(finalFormData as RegistrationData);
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
                  disabled={isSubmitting}
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
            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            autoFocus
            disabled={isSubmitting}
          />
        );

      case "select":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange(option.value)}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
            disabled={isSubmitting}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFirstStep ? "← Back to Home" : "← Previous"}
          </button>

          {isLastStep ? (
            <button
              onClick={handleRegister}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing Registration...</span>
                </>
              ) : (
                <>
                  <span>✨ Complete Registration</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          )}
        </div>

        {/* Warning message when submitting */}
        {isSubmitting && (
          <div className="mt-6 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-yellow-300 font-semibold mb-1">
                  Registration in Progress
                </p>
                <p className="text-white/70 text-sm">
                  Please do not close this window or navigate away. The
                  encryption and blockchain transaction process may take up to
                  30 seconds.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="animate-pulse bg-yellow-400 h-2 w-2 rounded-full"></div>
                  <span className="text-white/60 text-xs">
                    Check your wallet for transaction approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
