export default function AvatarCircle({ name, size = "md", src }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";
  if (src)
    return (
      <img src={src} alt={name} className={`${s} rounded-full object-cover`} />
    );
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(253,224,71,0.2)",
        color: "#FDE047",
      }}
    >
      {name ? name.charAt(0).toUpperCase() : "U"}
    </div>
  );
}
