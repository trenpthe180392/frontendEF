import Button from "../common/Button";

function Navbar() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">
          EventFlow
        </h1>
      </div>

      <nav className="flex items-center gap-4">
        <Button variant="ghost">
          Dashboard
        </Button>

        <Button variant="ghost">
          Events
        </Button>

        <Button variant="primary">
          Login
        </Button>
      </nav>
    </header>
  );
}

export default Navbar;