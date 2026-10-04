import AboutHero from "./AboutHero";
import AboutJourney from "./AboutJourney";
import AboutOffers from "./AboutOffers";
import AboutBranches from "./AboutBranches";
import { getCatalogBranches } from "@/lib/catalog/catalogQueries";
import type { AboutBranch } from "./aboutData";

export default async function AboutPage() {
  let branches: AboutBranch[] = [];
  let error = "";

  try {
    branches = await getCatalogBranches();
  } catch (branchError) {
    error = branchError instanceof Error ? branchError.message : "Branches unavailable";
  }

  return (
    <>
      <section>
        <AboutHero />
        <AboutJourney />
        <AboutOffers />
        <AboutBranches branches={branches} error={error} />
      </section>
    
    </>
  );
}
