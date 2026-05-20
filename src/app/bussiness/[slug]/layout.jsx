import React from "react";

export function getBusinessFranchiseLayoutClass() {
  return "min-h-screen bg-white";
}

const Layout = ({ children }) => {
  return <main className={getBusinessFranchiseLayoutClass()}>{children}</main>;
};

export default Layout;
