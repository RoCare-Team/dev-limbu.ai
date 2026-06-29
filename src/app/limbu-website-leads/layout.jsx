import Sidebar from "@/components/sidebar";

export default function DashboardLayout({ children }) {
  return (
    // The Sidebar component now handles the entire layout structure.
    <Sidebar>{children}</Sidebar>
  );
}
