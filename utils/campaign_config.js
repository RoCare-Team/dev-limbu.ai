const CAMPAIGN_CONFIG = {
  // 1 PARAM
  call_back: {
    name: "call_back",
    params: (d) => [
      d.userName
    ],
  },

  // 2 PARAMS
  not_interested: {
    name: "not_interested_confirmation",
    params: (d) => [
      d.userName,
      d.enquiryId
    ],
  },

  wrong_number: {
    name: "wrong_number_update",
    params: (d) => [
      d.userName,
      d.enquiryId
    ],
  },

  // 4 PARAMS
  call_not_picked: {
    name: "call_not_picked_followup",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile
    ],
  },

  callback_later: {
    name: "callback_later_after_call",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile
    ],
  },

  interested: {
    name: "interested_lead_after_call_premium",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile
    ],
  },

  switch_off: {
    name: "switch_off_followup",
    params: (d) => [
      d.userName,
      d.enquiryId,
      d.executiveName,
      d.executiveMobile
    ],
  },
};
