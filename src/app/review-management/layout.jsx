import Sidebar from "@/components/sidebar";

export default function PostManagementLayout({ children }) {

  console.log("children");
  
  return (
      <Sidebar>{children}</Sidebar>
    
  );
}
