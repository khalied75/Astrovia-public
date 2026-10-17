export const simulations = [
  {
    id: "cosmic",
    index: "01",
    title: "Cosmic Simulation",
    source: "Astrovia Project",
    description:
      "Explore an interactive cosmic environment created for the Astrovia universe.",
    url: "https://cosmicsimulation-c5104.web.app/",
  },
  {
    id: "nasa-eyes",
    index: "02",
    title: "Eyes on the Solar System",
    source: "NASA / JPL",
    description:
      "Travel through the Solar System and inspect planets, moons, spacecraft, and their motion.",
    url: "https://eyes.nasa.gov/apps/solar-system/#/home",
  },
  {
    id: "stellarium",
    index: "03",
    title: "Stellarium Star Map",
    source: "Stellarium Web",
    description:
      "Observe the sky from your location and identify stars, planets, and constellations in real time.",
    url: "https://stellarium-web.org/",
  },
];

export function findSimulation(id) {
  return simulations.find((simulation) => simulation.id === id);
}
