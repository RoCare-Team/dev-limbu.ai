import FloatingWhatsapp from "@/components/FloatingWhatsapp";
import React from "react";

export function getBusinessFranchiseLayoutClass() {
  return "min-h-screen bg-white";
}

const Layout = ({ children }) => {
  return (
    <main className={getBusinessFranchiseLayoutClass()}>
      {children}
      <FloatingWhatsapp />
    </main>
  );
};

export default Layout;
