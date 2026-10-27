import { LabStyle } from "./designLabModel";

export function LabMascot({ style, small = false }: { style: LabStyle; small?: boolean }) {
  const character = style === "storybook" ? "atelier" : style;
  return <svg className={`lab-mascot lab-mascot--${style}${small ? " lab-mascot--small" : ""}`} viewBox="0 0 180 180" fill="none" aria-hidden="true" focusable="false">
    {character === "atelier" && <>
      <path className="lab-mascot__shadow" d="M39 151c22 9 81 9 105 0" strokeWidth="5" strokeLinecap="round" />
      <path className="lab-mascot__body" d="M77 22c0-7 5-12 12-12s12 5 12 12v41c0 7 4 12 10 15l33 17c8 4 10 12 5 19l-34 43c-3 4-8 6-13 6H76c-5 0-10-2-13-6l-34-43c-5-7-3-15 5-19l32-17c7-3 11-8 11-15V22Z" strokeWidth="5" strokeLinejoin="round" />
      <path d="M76 82c12 8 32 8 45 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".35" />
      <circle cx="68" cy="111" r="4" fill="currentColor" /><circle cx="110" cy="111" r="4" fill="currentColor" />
      <path d="M79 125c5 6 15 6 20 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="59" cy="122" r="5" fill="#ECA49B" opacity=".8" /><circle cx="119" cy="122" r="5" fill="#ECA49B" opacity=".8" />
      <path d="m43 81-11-9m104 8 12-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </>}
    {style === "blueprint" && <>
      <path className="lab-mascot__shadow" d="M43 155h96" strokeWidth="4" strokeLinecap="round" />
      <rect className="lab-mascot__body" x="45" y="56" width="90" height="86" rx="20" strokeWidth="5" />
      <path d="M65 56V25c0-6 5-11 11-11h28c6 0 11 5 11 11v31" stroke="currentColor" strokeWidth="5" />
      <path d="M75 35h30M75 44h30" stroke="currentColor" strokeWidth="3" opacity=".5" />
      <circle cx="72" cy="93" r="5" fill="currentColor" /><circle cx="108" cy="93" r="5" fill="currentColor" />
      <path d="M77 112c7 7 19 7 26 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="m44 88-15-10m106 10 15-10M64 142l-6 12m58-12 6 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="149" cy="40" r="11" fill="#F7C976" /><path d="M149 33v14m-7-7h14" stroke="#314EA0" strokeWidth="2" />
    </>}
    {style === "studio" && <>
      <path className="lab-mascot__shadow" d="M42 152c22 8 75 8 97 0" strokeWidth="5" strokeLinecap="round" />
      <path className="lab-mascot__body" d="M53 69c-6-23 15-42 37-34 22-8 43 11 37 34 19 10 19 33 4 44 6 22-14 39-36 33-22 8-44-7-40-30-20-10-21-36-2-47Z" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="73" cy="88" r="5" fill="currentColor" /><circle cx="106" cy="88" r="5" fill="currentColor" />
      <path d="M79 106c6 6 16 6 22 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="59" cy="101" r="6" fill="#ECA6B4" opacity=".7" /><circle cx="120" cy="101" r="6" fill="#ECA6B4" opacity=".7" />
      <path d="m45 114-15 12m104-12 13 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="m128 55 18-28 9 5-18 28-12 7 3-12Z" fill="#F5BD7E" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </>}
    {style === "storybook" && <path d="m143 29 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#E6A783" />}
  </svg>;
}
