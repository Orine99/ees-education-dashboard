"use client";

import React from "react";

type TabKey = "charts" | "table";

export default function Tabs(props: {
  active: TabKey;
  setActive: (k: TabKey) => void;
}) {
  return (
    <div className="tab-switch" role="tablist" aria-label="View mode">
      <button
        type="button"
        role="tab"
        aria-selected={props.active === "charts"}
        className={`tab-button ${props.active === "charts" ? "is-active" : ""}`}
        onClick={() => props.setActive("charts")}
      >
        Charts
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={props.active === "table"}
        className={`tab-button ${props.active === "table" ? "is-active" : ""}`}
        onClick={() => props.setActive("table")}
      >
        Table
      </button>
    </div>
  );
}
