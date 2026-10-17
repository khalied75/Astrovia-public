import { Link } from "react-router-dom";

export default function ComingSoon({ section, title, description }) {
  return (
    <section className="relative mx-auto min-h-[75vh] w-[min(1200px,calc(100%_-_96px))] py-24 max-[1050px]:w-[calc(100%_-_56px)] max-[760px]:min-h-[70vh] max-[760px]:w-[calc(100%_-_40px)] max-[760px]:py-16">
      <p className="font-mono text-[10px] leading-7 tracking-[1.5px] text-neutral-400">
        {section}
      </p>
      <span
        className="absolute top-20 right-0 z-0 text-[260px] leading-none text-neutral-800 max-[760px]:top-24 max-[760px]:text-[200px]"
        aria-hidden="true"
      >
        ◎
      </span>
      <h1 className="relative max-w-[850px] text-[clamp(42px,6vw,78px)] leading-[1.05] tracking-[-3px] max-[760px]:text-[45px] max-[760px]:tracking-[-2px]">
        {title}
      </h1>
      <p className="relative my-7 max-w-[550px] text-[17px] leading-[1.8] text-neutral-400 max-[760px]:text-[15px]">
        {description}
      </p>
      <Link
        className="relative inline-flex min-h-[50px] items-center justify-between gap-6 bg-neutral-100 px-5 py-4 font-mono text-[10px] tracking-[.4px] text-neutral-950 uppercase transition hover:-translate-y-1 hover:bg-neutral-300"
        to="/"
      >
        Back to home <span className="text-base">↗</span>
      </Link>
    </section>
  );
}
