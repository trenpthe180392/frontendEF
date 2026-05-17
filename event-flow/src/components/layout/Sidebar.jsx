function Sidebar() {
  return (
    <aside className="min-h-screen w-64 border-r border-neutral-200 bg-white p-4">
      <ul className="space-y-3">
        <li className="font-medium text-neutral-700">Dashboard</li>
        <li className="font-medium text-neutral-700">Events</li>
        <li className="font-medium text-neutral-700">Tasks</li>
      </ul>
    </aside>
  );
}

export default Sidebar;