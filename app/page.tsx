"use client";

import { useState } from "react";
import EesControls from "@/components/EesControls";
import SchoolTable, {
  SelectedIndicator,
  SelectedLocation,
  SelectedTimePeriod,
} from "@/components/SchoolTable";
import Tabs from "@/components/Tabs";
import ChartsPanel from "@/components/ChartsPanel";
import { DATASET_ID } from "@/lib/dataset";

export default function Home() {
  const [indicator, setIndicator] = useState<SelectedIndicator | null>(null);
  const [timePeriod, setTimePeriod] = useState<SelectedTimePeriod | null>(null);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [activeTab, setActiveTab] = useState<"charts" | "table">("charts");

  return (
    <main className="page-shell">
      <section className="hero-card reveal">
        <p className="hero-kicker">Portfolio project</p>
        <h1>Education Evidence Dashboard</h1>
        <p className="hero-copy">
          Explore Department for Education statistics with fast filtering, trend visualization, and
          high-volume table browsing.
        </p>

        <dl className="selection-grid" aria-live="polite">
          <div className="selection-item">
            <dt>Indicator</dt>
            <dd>{indicator?.label ?? "Not selected"}</dd>
          </div>
          <div className="selection-item">
            <dt>Time period</dt>
            <dd>{timePeriod?.label ?? timePeriod?.period ?? "Not selected"}</dd>
          </div>
          <div className="selection-item">
            <dt>Location</dt>
            <dd>{location?.label ?? location?.code ?? "Not selected"}</dd>
          </div>
        </dl>
      </section>

      <section className="surface-card reveal reveal-delay-1">
        <h2 className="section-title">Filters</h2>
        <EesControls
          indicator={indicator}
          timePeriod={timePeriod}
          location={location}
          setIndicator={setIndicator}
          setTimePeriod={setTimePeriod}
          setLocation={setLocation}
        />
      </section>

      <Tabs active={activeTab} setActive={setActiveTab} />

      <section className="surface-card reveal reveal-delay-2">
        {activeTab === "charts" ? (
          <ChartsPanel
            dataSetId={DATASET_ID}
            indicator={indicator}
            location={location}
            timePeriod={timePeriod}
          />
        ) : (
          <SchoolTable
            dataSetId={DATASET_ID}
            indicator={indicator}
            location={location}
            timePeriod={timePeriod}
          />
        )}
      </section>
    </main>
  );
}
