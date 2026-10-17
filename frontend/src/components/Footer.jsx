import { Link } from "react-router-dom";
import LogoMark from "./LogoMark";

export default function Footer() {
  return (
    <footer className="mx-auto flex w-[min(1200px,calc(100%_-_96px))] items-center justify-between border-t border-neutral-800 py-7 max-[1050px]:w-[calc(100%_-_56px)] max-[760px]:w-[calc(100%_-_40px)] max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-6">
      <div>
        <Link
          className="inline-flex items-center gap-3 font-mono text-xs font-bold tracking-[2px]"
          to="/"
        >
          <LogoMark />
          <span>ASTROVIA</span>
        </Link>
        <p className="my-2 text-[10px] text-neutral-400">
          A small world for an infinite universe.
        </p>
      </div>
      <div className="flex flex-col gap-4 text-right font-mono text-[7px] leading-relaxed tracking-[1px] text-neutral-400 max-[760px]:text-left">
        <span>MADE OF STARDUST. DRIVEN BY CURIOSITY.</span>
        <span>
          © {new Date().getFullYear()} ASTROVIA
          <span className="mx-4 text-sm">✳</span> EARTH, SOLAR SYSTEM
        </span>
      </div>
    </footer>
  );
}
