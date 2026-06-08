import BotanicalAccent from "@/components/Art/BotanicalAccent";
import { buildCareStartHref } from "@/config/carePaths";
import { brands } from "@/content/site";
import Image from "next/image";
import Link from "next/link";

const HeartIcon = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden fill="currentColor">
    <path d="M10 17.5S2.5 12.2 2.5 7.5a3.6 3.6 0 0 1 6.3-2.5L10 6.2l1.2-1.2A3.6 3.6 0 0 1 17.5 7.5C17.5 12.2 10 17.5 10 17.5Z" />
  </svg>
);

const ServicesHero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-nurture-rose-light/60 via-nurture-cream to-nurture-blush/40 pb-16 pt-10 sm:pb-20 sm:pt-14">
    <BotanicalAccent position="top-left" variant="sprig" className="opacity-40" />
    <BotanicalAccent position="top-right" variant="leaf" className="opacity-35" />

    <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <Image
              src={brands.nestingPlace.markSrc}
              alt=""
              aria-hidden
              width={56}
              height={56}
              className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-nurture-sage-dark">
              Compassionate care for
            </p>
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-nurture-charcoal sm:text-5xl lg:text-[3.35rem]">
            Every Step of Your Maternity Journey
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-nurture-charcoal/75">
            Evidence-based support, nurturing care, and expert guidance for you
            and your growing family — from pregnancy through the fourth
            trimester.
          </p>
          <Link
            href={buildCareStartHref()}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-nurture-rose px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-nurture-rose-dark"
          >
            <HeartIcon />
            Get Support Today
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-[2rem] border border-nurture-sage/20 bg-white/70 p-4 shadow-lg shadow-nurture-sage/10 backdrop-blur-sm sm:p-6">
            <svg viewBox="0 0 320 280" className="h-auto w-full" aria-hidden role="presentation">
              <rect width="320" height="280" fill="#FBF6EF" rx="24" />
              {/* soft backdrop blob */}
              <path
                d="M70 120c-12-44 26-86 84-90 50-3 96 24 104 64 7 36-8 78-44 98-40 22-96 18-128-8-22-18-12-40-16-64Z"
                fill="#E7E1EE"
                opacity="0.65"
              />
              <ellipse cx="160" cy="244" rx="96" ry="14" fill="#B8A9C9" opacity="0.25" />

              {/* left plant */}
              <g>
                <path d="M70 232l8-44h26l8 44Z" fill="#D7C7B5" />
                <path d="M91 188c0-28-12-44-26-52 16 0 30 16 30 44Z" fill="#A9C3A6" />
                <path d="M91 188c0-26 12-42 28-48-14 4-26 18-26 44Z" fill="#8AAA88" />
                <path d="M91 188c-2-20-14-30-26-32 14-2 26 8 28 28Z" fill="#D4E5D0" />
              </g>

              {/* right plant */}
              <g>
                <path d="M222 232l7-40h24l7 40Z" fill="#D7C7B5" />
                <path d="M241 192c0-24 10-38 24-44-12 4-22 16-22 40Z" fill="#A9C3A6" />
                <path d="M241 192c0-22-10-34-24-38 12 2 24 14 26 36Z" fill="#8AAA88" />
                <path d="M241 192c2-16 12-24 22-26-12 0-22 8-24 24Z" fill="#D4E5D0" />
              </g>

              {/* pregnant woman in lotus pose */}
              {/* hair */}
              <path d="M132 86c-7 13-9 30-5 45 0 0 12 9 33 9s33-9 33-9c4-15 2-32-5-45-7-13-19-20-28-21-9 1-21 8-28 21Z" fill="#6E5848" />
              {/* head */}
              <circle cx="160" cy="92" r="24" fill="#E6C0AE" />
              <path d="M132 86c7-13 19-20 28-21 9 1 21 8 28 21-6-5-16-9-28-9s-22 4-28 9Z" fill="#574436" />
              {/* torso + belly */}
              <path d="M122 150c0-21 17-36 38-36s38 15 38 36c0 22-6 40-15 50h-46c-9-10-15-28-15-50Z" fill="#FFFFFF" />
              <ellipse cx="160" cy="172" rx="34" ry="29" fill="#EFE9F2" />
              {/* crossed legs */}
              <path d="M104 214c14-13 36-17 56-17s42 4 56 17c7 7 3 17-7 19l-49 5-49-5c-10-2-14-12-7-19Z" fill="#B8A9C9" />
              <path d="M138 202c14 7 30 7 44 0" stroke="#9E8DB6" strokeWidth="3" fill="none" />
              {/* arms cradling belly */}
              <path d="M126 158c-5 15-3 30 12 40" stroke="#D9AE9B" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M194 158c5 15 3 30-12 40" stroke="#D9AE9B" strokeWidth="10" strokeLinecap="round" fill="none" />

              {/* floating accents */}
              <circle cx="60" cy="96" r="5" fill="#C4A4B5" opacity="0.6" />
              <circle cx="266" cy="118" r="4" fill="#B8A9C9" opacity="0.55" />
              <circle cx="96" cy="70" r="3.5" fill="#E8D8F0" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ServicesHero;
