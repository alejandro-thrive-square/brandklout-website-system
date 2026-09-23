/*
  REQUIRED BEFORE LAUNCH:
  Set formEndpoint to the approved HTTPS endpoint that should receive leads.
  When it is blank, the form runs in preview mode and DOES NOT transmit or retain
  phone numbers or email addresses; it only demonstrates the thank-you redirect.
*/
window.GMD_CONFIG = {
  formEndpoint: '',
  formMethod: 'POST',
  formHeaders: {},
  includeCredentials: false,
};

