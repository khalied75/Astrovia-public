import { lazy, Suspense, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import LogoMark from "./LogoMark";

const NotificationCenter = lazy(
  () => import("./notifications/NotificationCenter"),
);
const MessagesNavLink = lazy(() => import("./messages/MessagesNavLink"));

const links = [
  ["/", "Home"],
  ["/publish", "Publish"],
  ["/simulations", "Simulations"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigation = [
    ...links,

    ["/questions", "Questions"],
    ["/messages", "Messages"],
    ...(isAdmin ? [["/admin", "Admin"]] : []),
    [user ? "/account" : "/login", user ? "Your account" : "Sign in"],

  ];

  return (
    <header className="relative z-10 mx-auto mt-6 flex h-[76px] w-[min(1200px,calc(100%_-_96px))] items-center justify-between border border-neutral-700 px-6 max-[1050px]:w-[calc(100%_-_56px)] max-[1050px]:px-4 max-[760px]:mt-4 max-[760px]:h-16 max-[760px]:w-[calc(100%_-_40px)]">
      <Link
        className="inline-flex items-center gap-3 font-mono text-sm font-bold tracking-[2px] max-[760px]:text-xs"
        to="/"
        aria-label="Astrovia home"
        onClick={() => setOpen(false)}
      >
        <LogoMark />
        <span>
          ASTROVIA
          <span className="text-[10px] tracking-normal text-neutral-500">
            {" "}
            / 01
          </span>
        </span>
      </Link>

      <button
        className="hidden p-2.5 font-mono text-[10px] uppercase max-[760px]:block"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close -" : "Menu +"}
      </button>

      <nav
        id="main-navigation"
        aria-label="Main navigation"
        className={`${open ? "max-[760px]:flex" : "max-[760px]:hidden"} flex h-full items-center gap-7 max-[1050px]:gap-4 max-[760px]:absolute max-[760px]:top-[63px] max-[760px]:-right-px max-[760px]:-left-px max-[760px]:h-auto max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:gap-0 max-[760px]:border max-[760px]:border-neutral-700 max-[760px]:bg-neutral-900 max-[760px]:px-5 max-[760px]:py-3`}
      >
        {navigation.map(([path, name]) => {
          if (path === "/messages") {
            return (
              <Suspense key={path} fallback={null}>
                <MessagesNavLink onNavigate={() => setOpen(false)} />
              </Suspense>
            );
          }
          const accountLink = path === "/login" || path === "/account";
          return (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                accountLink
                  ? `${isActive ? "bg-neutral-100 text-neutral-950 shadow-none" : "text-white shadow-[3px_3px_0_#525252]"} relative flex h-10 items-center border border-neutral-300 px-4 whitespace-nowrap font-mono text-[10px] font-bold uppercase transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-neutral-100 hover:text-neutral-950 hover:shadow-none max-[760px]:my-2 max-[760px]:justify-center`
                  : `${isActive ? "text-white after:absolute after:right-0 after:bottom-4 after:left-0 after:h-px after:bg-neutral-200 max-[760px]:after:right-auto max-[760px]:after:bottom-1.5 max-[760px]:after:w-7" : "text-neutral-400"} relative flex h-full items-center whitespace-nowrap font-mono text-[10px] font-bold uppercase transition-colors hover:text-white max-[760px]:py-4`
              }
            >
              {name}
            </NavLink>
          );
        })}
        {user ? (
          <Suspense
            fallback={
              <span className="size-10 border border-neutral-800 max-[760px]:my-2 max-[760px]:w-full" />
            }
          >
            <NotificationCenter onNavigate={() => setOpen(false)} />
          </Suspense>
        ) : (
          <Link
            className="relative grid size-10 shrink-0 place-items-center border border-neutral-700 text-neutral-500 hover:text-white max-[760px]:my-2 max-[760px]:w-full"
            to="/login"
            aria-label="Sign in to view notifications"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
              <path d="M10 21h4" />
            </svg>
          </Link>
        )}
      </nav>
    </header>
  );
}
