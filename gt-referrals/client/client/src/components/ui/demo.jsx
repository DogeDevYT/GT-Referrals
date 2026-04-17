import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, GraduationCap, UsersRound } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import "./demo.css";

const STAT_CARDS = [
  {
    icon: GraduationCap,
    title: "GT-first network",
    text: "Discover alumni who understand Tech culture and recruiting pressure.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Referral momentum",
    text: "Prioritize requests with credits and club overlap to move faster.",
  },
  {
    icon: UsersRound,
    title: "Warm intros",
    text: "Connect through communities before your application goes cold.",
  },
];

const MAIN_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80";
const MINI_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80";

export function BlurFadeTextDemo() {
  const [mainImageFailed, setMainImageFailed] = useState(false);
  const [miniImageFailed, setMiniImageFailed] = useState(false);

  return (
    <section id="header" className="hero-shell" aria-label="Landing hero">
      <div className="hero-glow-a" />
      <div className="hero-glow-b" />

      <div className="hero-content">
        <div>
          <BlurFade delay={0.06} inView>
            <p className="hero-eyebrow">
              Built for Georgia Tech referrals
            </p>
          </BlurFade>

          <BlurFade delay={0.14} inView>
            <h1 className="hero-title">
              Turn alumni community into interview momentum.
            </h1>
          </BlurFade>

          <BlurFade delay={0.22} inView>
            <p className="hero-copy">
              GT Referrals helps students and alumni coordinate high-intent referrals with transparency,
              priority scoring, and shared club context built in.
            </p>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <div className="hero-cta-row">
              <Link
                to="/register"
                className="hero-btn hero-btn-primary"
              >
                Join GT Referrals
                <ArrowRight size={16} strokeWidth={2.35} />
              </Link>
              <Link
                to="/login"
                className="hero-btn hero-btn-secondary"
              >
                Sign in
              </Link>
            </div>
          </BlurFade>

          <div className="hero-feature-grid">
            {STAT_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <BlurFade key={card.title} delay={0.38 + index * 0.08} inView>
                  <article className="hero-feature">
                    <Icon size={20} className="hero-feature-icon" strokeWidth={2.1} />
                    <h3 className="hero-feature-title">{card.title}</h3>
                    <p className="hero-feature-text">{card.text}</p>
                  </article>
                </BlurFade>
              );
            })}
          </div>
        </div>

        <BlurFade delay={0.16} inView>
          <div className="hero-image-card">
            {!mainImageFailed ? (
              <img
                src={MAIN_IMAGE}
                alt="Students walking across a university campus"
                className="hero-image-main"
                onError={() => setMainImageFailed(true)}
                loading="eager"
              />
            ) : (
              <div className="hero-image-fallback" role="img" aria-label="Campus scene" />
            )}

            {!miniImageFailed ? (
              <img
                src={MINI_IMAGE}
                alt="A small group of students collaborating"
                className="hero-image-mini"
                onError={() => setMiniImageFailed(true)}
                loading="lazy"
              />
            ) : (
              <div className="hero-image-mini-fallback" aria-hidden="true" />
            )}

            <div className="hero-image-overlay">
              Priority referrals by credits + shared clubs
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
