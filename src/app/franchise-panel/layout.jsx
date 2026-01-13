export default function FranchiseLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white p-6">
        <h2 className="text-2xl font-bold mb-8">MK Limbu Franchise</h2>
        
        <nav className="space-y-4">
          <NavItem title="Dashboard" />
          <NavItem title="Leads" />
          {/* <NavItem title="Users" /> */}
          <NavItem title="Reacharge" />
          {/* <NavItem title="WhatsApp" /> */}
          <NavItem title="Settings" />
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1">
        
        {/* Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">Franchise Admin</span>
            <div className="w-10 h-10 rounded-full bg-blue-500"></div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ title }) {
  return (
    <div className="px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition">
      {title}
    </div>
  );
}
