import { useState, useCallback, useRef, useEffect } from 'react';
import { getValidationError } from '../utilities/validate.utilities';
import { formatOutput } from '../utilities/helpers.utilities';

export const useForm = (initialForm = {}) => {
  const [formData, setFormData] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const fieldsValidation = useRef({});
  const fieldsOutput = useRef({});
  const onSubmit = useRef(null);

  useEffect(() => {});

  const register = useCallback(
    (name, validations = {}, output) => {
      if (!fieldsValidation.current[name])
        fieldsValidation.current[name] = validations;
      if (!fieldsOutput.current[name] && output)
        fieldsOutput.current[name] = output;

      return {
        errors: errors,
        value: formData[name],
        handleChange: value => setFormData(prev => ({ ...prev, [name]: value }))
      };
    },
    [errors, formData]
  );

  const isInvalidValue = value => {
    if (value === null || value === undefined || value === '') {
      return true;
    }
    if (Array.isArray(value)) {
      return value.every(isInvalidValue);
    }
    return false;
  };

  const deepFilter = obj => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(deepFilter).filter(item => !isInvalidValue(item));
    }

    return (
      Object.entries(obj)
        //eslint-disable-next-line
        .filter(([_, value]) => !isInvalidValue(value))
        .reduce((acc, [key, value]) => {
          acc[key] = deepFilter(value);
          return acc;
        }, {})
    );
  };

  const reset = useCallback(() => {
    setFormData(initialForm);
    //eslint-disable-next-line
  }, [initialForm]);

  const setForm = useCallback(data => {
    setFormData(deepFilter(data));
    //eslint-disable-next-line
  }, []);

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      e.stopPropagation();

      const validationResult = validateFields(formData);
      if (validationResult.haveErrors) return;
      if (!onSubmit.current) return;

      const formattedData = formatFormData(validationResult.data);
      setPending(true);

      try {
        await onSubmit.current(formattedData);
      } finally {
        setPending(false);
      }
    },
    // eslint-disable-next-line
    [formData]
  );

  const formatFormData = useCallback(data => {
    const formattedData = { ...data };
    Object.keys(fieldsOutput.current).forEach(name => {
      if (fieldsOutput.current[name]) {
        formattedData[name] = formatOutput(
          data[name],
          fieldsOutput.current[name]
        );
      }
    });
    return formattedData;
  }, []);

  const validateFields = useCallback(data => {
    let haveErrors = false;
    const errors = {};

    Object.keys(fieldsValidation.current).forEach(name => {
      const validation = fieldsValidation.current[name];
      const value = data[name];

      const error = getValidationError(value, validation);
      if (error) {
        haveErrors = true;
        errors[name] = error;
      }
    });

    setErrors(errors);
    return { haveErrors, data };
  }, []);

  const handleAssistant = useCallback(
    async e => e.key === 'Enter' && (await handleSubmit(e)),
    [handleSubmit]
  );

  const registerSubmit = useCallback(func => {
    onSubmit.current = func;
  }, []);

  return {
    register,
    registerSubmit,
    handleSubmit,
    handleAssistant,
    reset,
    setForm,
    setFormData,
    pending: pending,
    watch: formData,
    errors: errors
  };
};
