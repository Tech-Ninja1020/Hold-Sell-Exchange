export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-page grid-cols-12 gap-6 px-6 py-10 text-sm text-text-muted">
        <p className="col-span-12 lg:col-span-7">
          Simplified on purpose: flat tax rates instead of brackets, suspended losses with no
          $25,000 allowance, a fresh 27.5-year schedule on the replacement property, no 45 or
          180-day exchange deadlines, and a reinvestment rate that is already after tax.
        </p>
        <div className="col-span-12 lg:col-span-5 lg:text-right">
          <p>This is a modeling exercise, not tax advice.</p>
          <a
            href="https://github.com/Tech-Ninja1020/Hold-Sell-Stimulation"
            className="mt-2 inline-block text-text underline decoration-line-strong underline-offset-4"
          >
            Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
