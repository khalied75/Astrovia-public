import { useState } from "react";
import { Link, Navigate, Outlet, useParams } from "react-router-dom";
import { findSimulation, simulations } from "../data/simulations";

export default function Simulations() {
  const { simulationId } = useParams();

  return (
    <section className="mx-auto w-[min(1240px,calc(100%_-_40px))] py-12">
      <header className="mb-8 border-b border-neutral-800 pb-7">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
          02 / INTERACTIVE OBSERVATORY
        </p>
        <div className="flex items-end justify-between gap-8 max-[720px]:items-start max-[720px]:flex-col">
          <div>
            <h1 className="text-4xl tracking-[-1.5px]">Simulations.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-400">
              Enter interactive models of the cosmos without leaving Astrovia.
            </p>
          </div>
          {simulationId && (
            <Link
              className="border border-neutral-600 px-4 py-3 font-mono text-[9px] uppercase hover:border-white"
              to="/simulations"
            >
              All simulations
            </Link>
          )}
        </div>
      </header>

      <nav className="mb-8 grid grid-cols-3 gap-3 max-[800px]:grid-cols-1" aria-label="Simulation selector">
        {simulations.map((simulation) => (
          <Link
            className={`group border p-5 transition ${simulationId === simulation.id ? "border-white bg-white text-black" : "border-neutral-800 bg-[#0d0d0d] hover:border-neutral-500"}`}
            key={simulation.id}
            to={`/simulations/${simulation.id}`}
          >
            <span className={`font-mono text-[8px] tracking-[1.5px] ${simulationId === simulation.id ? "text-neutral-600" : "text-neutral-500"}`}>
              {simulation.index} / {simulation.source.toUpperCase()}
            </span>
            <span className="mt-4 flex items-end justify-between gap-3 text-lg">
              {simulation.title}
              <span className="font-mono text-xs transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </nav>

      <Outlet />
    </section>
  );
}

export function SimulationIndex() {
  return (
    <div className="grid min-h-64 place-items-center border border-neutral-800 bg-[linear-gradient(#ffffff05_1px,transparent_1px),linear-gradient(90deg,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] px-6 text-center">
      <div>
        <span className="text-3xl text-neutral-500">✦</span>
        <h2 className="mt-4 text-2xl">Choose an instrument.</h2>
        <p className="mt-3 text-sm text-neutral-500">
          Select one of the simulations above to begin exploring.
        </p>
      </div>
    </div>
  );
}

export function SimulationViewer() {
  const { simulationId } = useParams();
  const simulation = findSimulation(simulationId);
  const [loaded, setLoaded] = useState(false);

  if (!simulation) return <Navigate to="/simulations" replace />;

  return (
    <article className="border border-neutral-700 bg-[#080808]">
      <header className="flex items-center justify-between gap-5 border-b border-neutral-800 px-5 py-4 max-[600px]:items-start max-[600px]:flex-col">
        <div>
          <p className="font-mono text-[8px] tracking-[1.3px] text-neutral-500">
            LIVE MODULE / {simulation.source.toUpperCase()}
          </p>
          <h2 className="mt-2 text-xl">{simulation.title}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500">
            {simulation.description}
          </p>
        </div>
        <a
          className="shrink-0 border border-neutral-600 px-4 py-3 font-mono text-[9px] uppercase hover:border-white"
          href={simulation.url}
          target="_blank"
          rel="noreferrer"
        >
          Open fullscreen ↗
        </a>
      </header>

      <div className="relative h-[min(76vh,820px)] min-h-[560px] bg-neutral-950 max-[600px]:min-h-[480px]">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center font-mono text-[9px] tracking-[1.5px] text-neutral-500">
            CONNECTING TO {simulation.source.toUpperCase()}...
          </div>
        )}
        <iframe
          className="relative size-full border-0 bg-black"
          src={simulation.url}
          title={simulation.title}
          allow="accelerometer; autoplay; clipboard-read; clipboard-write; fullscreen; geolocation; gyroscope"
          allowFullScreen
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </article>
  );
}
