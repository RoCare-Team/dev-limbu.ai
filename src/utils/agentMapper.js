const AGENT_DETAILS_MAP = {
  "699c100f90278fadff8f8aa9": {
    name: "Imran Ahmed",
    phone: "919355030762",
  },
  "69f07b575b51cc69c1293a2c": {
    name: "Jahan Singh",
    phone: "919311203803",
  },
  "6a3005e2502f1d1fd963b06c": {
    name: "Vishal",
    phone: "917303888099", // temporary
  },
};

export function getAgentPhone(agentId) {
  return AGENT_DETAILS_MAP[agentId?.toString()]?.phone || null;
}

export function getAgentDetails(agentId) {
  return AGENT_DETAILS_MAP[agentId?.toString()] || null;
}