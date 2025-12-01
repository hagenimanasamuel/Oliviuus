// utils/validate.js

export const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length < 2) {
    return "full_name_error"; // translation key
  }
  return "";
};

export const validatePassword = (password) => {
  const minLength = 8;
  const maxLength = 24;
  if (!password) return "password_required";
  if (password.length < minLength || password.length > maxLength) return "password_length";
  
  const uppercase = /[A-Z]/;
  const lowercase = /[a-z]/;
  const number = /[0-9]/;
  const special = /[!@#$%^&*(),.?":{}|<>]/;

  if (!uppercase.test(password)) return "password_uppercase";
  if (!lowercase.test(password)) return "password_lowercase";
  if (!number.test(password)) return "password_number";
  if (!special.test(password)) return "password_special";

  return "";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (password !== confirmPassword) return "passwords_mismatch";
  return "";
};
