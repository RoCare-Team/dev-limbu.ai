import React from "react";

const UserAvatar = React.memo(({ name, size = "md", src }) => {
  const s = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  if (src)
    return (
      <img src={src} alt={name} className={`${s} rounded-xl object-cover ring-1 ring-slate-100 shadow-sm`} />
    );
  return (
    <div
      className={`${s} rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-slate-100 uppercase tracking-tighter`}
      style={{
        backgroundColor: "rgba(250, 204, 21, 0.12)",
        color: "#EAB308",
      }}
    >
      {name ? name.charAt(0) : "U"}
    </div>
  );
});

UserAvatar.displayName = "UserAvatar";
export default UserAvatar;
