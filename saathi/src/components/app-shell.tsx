import Link from "next/link";
import { BackIcon, HomeIcon, ItemsIcon, MsgIcon, PostsIcon, SettingsIcon } from "@/components/icons";

export function AppShell({
  title,
  sub,
  tab,
  backHref,
  needsCount = 0,
  children,
}: {
  title: string;
  sub: string;
  tab?: "home" | "messages" | "posts" | "items" | "";
  backHref?: string;
  needsCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-row">
          {backHref ? (
            <Link className="back" href={backHref} aria-label="Back">
              <BackIcon />
            </Link>
          ) : null}
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <h1>{title}</h1>
            <div className="sub">{sub}</div>
          </div>
          <Link className="iconbtn" href="/app/settings" aria-label="Settings">
            <SettingsIcon />
          </Link>
        </div>
      </header>
      <main className="main">{children}</main>
      <nav className="nav" aria-label="Main">
        <div className="nav-in">
          <Link href="/app" aria-current={tab === "home" ? "page" : undefined}>
            <HomeIcon />
            Home
          </Link>
          <Link
            href="/app/messages"
            aria-current={tab === "messages" ? "page" : undefined}
          >
            {needsCount > 0 ? <span className="dot">{needsCount}</span> : null}
            <MsgIcon />
            Messages
          </Link>
          <Link href="/app/posts" aria-current={tab === "posts" ? "page" : undefined}>
            <PostsIcon />
            Posts
          </Link>
          <Link href="/app/items" aria-current={tab === "items" ? "page" : undefined}>
            <ItemsIcon />
            Items
          </Link>
        </div>
      </nav>
    </div>
  );
}
