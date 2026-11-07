import { useState, useCallback } from "react";

/**
 * Custom hook for form state management
 * @param {Object} initialValues - Initial form values
 */
export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const validate = useCallback((validationRules) => {
    const newErrors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(validationRules)) {
      for (const rule of rules) {
        const value = values[field];

        if (rule.required && (!value || (typeof value === "string" && !value.trim()))) {
          newErrors[field] = rule.message || `${field} is required`;
          isValid = false;
          break;
        }

        if (rule.minLength && value && value.length < rule.minLength) {
          newErrors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
          isValid = false;
          break;
        }

        if (rule.pattern && value && !rule.pattern.test(value)) {
          newErrors[field] = rule.message || `${field} is invalid`;
          isValid = false;
          break;
        }

        if (rule.custom && value) {
          const customError = rule.custom(value);
          if (customError) {
            newErrors[field] = customError;
            isValid = false;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values]);

  return {
    values,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setFieldValue,
    setValues,
    setErrors,
    reset,
    validate,
  };
};
