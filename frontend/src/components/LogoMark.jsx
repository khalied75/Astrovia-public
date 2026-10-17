import icon from "../assets/icon.png";

export default function LogoMark() {
  return (
    <span
      className="relative block h-8 w-10 shrink-0 overflow-hidden"
      aria-hidden="true"
    >
      <img
        className="absolute -top-1.5 left-1/2 w-12 max-w-none -translate-x-1/2"
        src={icon}
        alt=""
      />
    </span>
  );
}
