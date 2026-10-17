import PasswordResetForm from "../components/auth/PasswordResetForm";
import Footer from "../components/Footer";
import LogoMark from "../components/LogoMark";
import { Link } from "react-router-dom";

export default function AuthAction() {
  return (
    <div className="min-h-screen overflow-hidden [background-image:linear-gradient(#ffffff03_1px,transparent_1px),linear-gradient(90deg,#ffffff03_1px,transparent_1px)] [background-size:80px_80px]">
      <header className="mx-auto mt-6 flex h-[76px] w-[min(1200px,calc(100%_-_96px))] items-center border border-neutral-700 px-6 max-[760px]:mt-4 max-[760px]:h-16 max-[760px]:w-[calc(100%_-_40px)]">
        <Link
          className="inline-flex items-center gap-3 font-mono text-sm font-bold tracking-[2px]"
          to="/"
          aria-label="Astrovia home"
        >
          <LogoMark />
          <span>
            ASTROVIA
            <span className="text-[10px] tracking-normal text-neutral-500">
              {" "}/ 01
            </span>
          </span>
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-235px)] w-[min(1000px,calc(100%_-_40px))] grid-cols-[.9fr_1.1fr] border-x border-neutral-800 max-[760px]:grid-cols-1 max-[760px]:border-0">
        <div className="relative overflow-hidden border-r border-neutral-800 p-12 max-[760px]:hidden">
          <p className="font-mono text-[9px] tracking-[1.5px] text-neutral-400">
            IDENTITY / RECOVERY
          </p>
          <div className="absolute top-1/2 left-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-800 before:absolute before:inset-10 before:rounded-full before:border before:border-dashed before:border-neutral-700 after:absolute after:top-1/2 after:left-1/2 after:size-32 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-[radial-gradient(circle_at_35%_30%,#ddd,#555_42%,#111_72%)]" />
          <p className="absolute bottom-10 max-w-[280px] text-3xl leading-tight tracking-[-1px]">
            Recalibrate your access to the universe.
          </p>
        </div>
        <section className="flex items-center px-14 py-16 max-[760px]:px-0 max-[760px]:py-12">
          <div className="mx-auto w-full max-w-[410px]">
            <PasswordResetForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
