import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  ACADEMY_HIGHLIGHTS,
  BRAND_ASSETS,
  getVisibleItems,
  type AcademyCourse,
} from '../lib/domain';

interface SampoornaAcademySectionProps {
  courses: AcademyCourse[];
  onEnquireCourse: (course: AcademyCourse) => void;
  onJoinAcademy: () => void;
}

export function SampoornaAcademySection({
  courses,
  onEnquireCourse,
  onJoinAcademy,
}: SampoornaAcademySectionProps) {
  const [imgError, setImgError] = useState(false);
  const visibleCourses = getVisibleItems(courses);
  if (visibleCourses.length === 0) return null;

  return (
    <section id="sampoorna-academy" className="bg-white border-b border-neutral-200 py-14 lg:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-[#F3F3F3] border border-neutral-200 min-h-[260px] sm:min-h-[340px]">
            {!imgError ? (
              <img
                src={BRAND_ASSETS.sampoornaAcademy}
                alt="Sampoorna Music Academy classroom with keyboard synthesizer, tabla pair, bansuri flute, and vocal condenser microphone"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-8 text-[#171717] font-display text-2xl">
                Sampoorna Music Academy
              </div>
            )}
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#FF5A1F]">Sampoorna Music Academy</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#171717] leading-[1.1] [text-wrap:balance]">
              Learn music. Find your rhythm.
            </h2>
            <p className="mt-3 text-neutral-600 leading-relaxed max-w-[44ch]">
              Structured training in Vocal, Keyboard, Flute &amp; Tabla with studio practice.
            </p>

            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-700">
              {ACADEMY_HIGHLIGHTS.slice(0, 4).map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF5A1F] shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onJoinAcademy}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#FF5A1F] hover:bg-[#E04810] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Join Academy
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#contact"
                className="px-5 py-3 text-sm font-semibold text-[#171717] bg-[#F3F3F3] hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Book Trial Class
              </a>
            </div>
          </div>
        </div>

        {/* Clean Structured Music Courses */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCourses.map((course) => (
            <article
              key={course.id}
              className="bg-[#F3F3F3]/60 border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-400 transition-colors"
            >
              <div>
                <p className="text-xs font-medium text-neutral-500">{course.duration}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-[#171717]">
                  {course.title}
                </h3>
                <p className="mt-1 font-mono text-base font-semibold text-[#FF5A1F] tabular-nums">
                  {course.feeLabel}
                </p>

                <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-neutral-700">
                  {course.curriculum.slice(0, 3).map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onEnquireCourse(course)}
                className="mt-5 w-full py-2.5 px-4 text-sm font-semibold text-[#171717] bg-white border border-neutral-300 hover:border-[#FF5A1F] hover:text-[#FF5A1F] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Enquire
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
