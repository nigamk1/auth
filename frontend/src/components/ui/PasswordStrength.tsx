import React from "react";

interface PasswordStrengthProps {
  password: string;
  show?: boolean;
}

interface StrengthCheck {
  label: string;
  regex: RegExp;
}

const strengthChecks: StrengthCheck[] = [
  { label: "At least 8 characters", regex: /.{8,}/ },
  { label: "Contains uppercase letter", regex: /[A-Z]/ },
  { label: "Contains lowercase letter", regex: /[a-z]/ },
  { label: "Contains number", regex: /\d/ },
  { label: "Contains special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  show = true,
}) => {
  if (!show || !password) return null;

  const passedChecks = strengthChecks.filter((check) =>
    check.regex.test(password)
  );
  const strength = passedChecks.length;

  const getStrengthColor = () => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  const getStrengthTextColor = () => {
    if (strength <= 2) return "text-red-600";
    if (strength <= 3) return "text-yellow-600";
    if (strength <= 4) return "text-blue-600";
    return "text-green-600";
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(strength / strengthChecks.length) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${getStrengthTextColor()}`}>
          {getStrengthText()}
        </span>
      </div>

      {/* Requirement Checklist */}
      <div className="space-y-1">
        {strengthChecks.map((check, index) => {
          const passed = check.regex.test(password);
          return (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <svg
                className={`h-3 w-3 ${
                  passed ? "text-green-500" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className={passed ? "text-green-600" : "text-gray-500"}>
                {check.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;
