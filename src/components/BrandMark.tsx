import logo from "../assets/logo.png";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-lockup ${className}`}>
      <img className="pixel" src={logo} alt="Joja Cola" />
    </span>
  );
}
