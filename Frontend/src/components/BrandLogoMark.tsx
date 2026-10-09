import logoUrl from "../assets/racletty-logo.svg";

type BrandLogoMarkProps = {
  className?: string;
};

export function BrandLogoMark({ className }: BrandLogoMarkProps) {
  return (
    <img
      className={className}
      src={logoUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
