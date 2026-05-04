export function normalizePlatformDescriptions(raw) {
  if (raw == null) {
    return { gmb_des: "", fb_des: "", ig_des: "", li_des: "", pi_des: "" };
  }

  let o = raw;
  if (Array.isArray(o) && o.length) {
    o = o[0];
  }
  if (typeof o === "string") {
    try {
      const parsed = JSON.parse(o);
      if (parsed && typeof parsed === "object") o = parsed;
    } catch {
      return { gmb_des: "", fb_des: "", ig_des: "", li_des: "", pi_des: "" };
    }
  }
  if (o && typeof o === "object" && o.data && typeof o.data === "object") {
    o = { ...o.data, ...o };
  }

  const pick = (...keys) => {
    for (const k of keys) {
      const v = o[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  return {
    gmb_des: pick("gmb_des", "gmbDescription", "GMB_des", "gmbDesc", "gmb_description"),
    fb_des: pick("fb_des", "fbDescription", "FB_des", "fbDesc", "fb_description"),
    ig_des: pick("ig_des", "igDescription", "IG_des", "igDesc", "ig_description"),
    li_des: pick("li_des", "liDescription", "LI_des", "liDesc", "li_description", "linkedin_description", "linkedinDescription"),
    pi_des: pick("pi_des", "piDescription", "PI_des", "piDesc", "pi_description", "pinterest_description", "pinterestDescription"),
  };
}