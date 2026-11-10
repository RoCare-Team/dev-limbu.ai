import Sidebar from "@/components/sidebar";

export const metadata = { title: "Website Audit | Limbu.ai" };

export default function DashboardLayout({ children }) {
  return <Sidebar>{children}</Sidebar>;
}
