import { useState } from "react";
import { ResponsiveTabBar } from "../ResponsiveTabBar";
import { PortIndustryTab } from "./PortIndustryTab";

type Industry = "ports" | "fertilizer" | "oilgas" | "steel" | "chemicals" | "rubber";

export function IndustryTab() {
  const [industry, setIndustry] = useState<Industry>("ports");

  return (
    <section className="industryTab">
      <ResponsiveTabBar<Industry>
        className="industrySelector"
        ariaLabel="Nhóm ngành"
        activeId={industry}
        onChange={setIndustry}
        items={[
          { id: "ports", label: "Cảng" },
          { id: "fertilizer", label: "Phân bón", disabled: true },
          { id: "oilgas", label: "Dầu khí", disabled: true },
          { id: "steel", label: "Thép", disabled: true },
          { id: "chemicals", label: "Hóa chất", disabled: true },
          { id: "rubber", label: "Cao su", disabled: true }
        ]}
      />
      {industry === "ports" && <PortIndustryTab />}
    </section>
  );
}
