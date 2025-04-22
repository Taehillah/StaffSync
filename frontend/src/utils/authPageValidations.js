export const forceNumberRegex = /^\d{8}(MC|MI|PE|PV)$/;

export const validateForceNumber = (number) => {
  return forceNumberRegex.test(number);
};

export const musteringCodes = [
  'C2', 'P', 'PR', 'SS', 'T', 'E', 
  'MP', 'L', 'HR', 'CH', 'INT'
];