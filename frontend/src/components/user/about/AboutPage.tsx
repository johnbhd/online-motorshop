"use client"
import AboutHero from "./AboutHero";
import AboutJourney from "./AboutJourney"
import AboutOffers from "./AboutOffers"
import AboutBranches from "./AboutBranches"

export default function AboutPage() {
  return (
    <section >
      <div className="about-section">
        <AboutHero />
      </div>
      <AboutJourney/>
      <AboutOffers/>
      <AboutBranches/>
    </section>
  );
}
