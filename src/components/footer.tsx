import { BloomMark } from "@/components/brand/bloom-mark";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BloomMark className="size-5" />
          <span>Bloom is a fictional coffee brand. No real orders are shipped.</span>
        </div>
        <a
          href="https://github.com/iamashav/bloom-coffee"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
