export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} ALD Motorshop. All rights reserved.
      </div>
    </footer>
  );
}
