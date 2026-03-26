function ProfileStrengthRing({ score = 72 }) {
  const r = 20, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="#f59e0b" strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 26 26)" />
      <text x="26" y="31" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1f2937">{score}%</text>
    </svg>
  );
}

export default ProfileStrengthRing;

