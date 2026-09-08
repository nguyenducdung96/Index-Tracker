import { useEffect, useMemo, useState } from "react";
import type { PortOverviewResponse } from "../../types";
import "./PortAuthorityOverview.css";

type AuthorityRow = {
  authority: string;
  shipCalls: number | null;
  gtTotal: number | null;
  cargoTons: number | null;
  containerTeu: number | null;
};

type NationalStats = {
  provider: "VIMAWA";
  sourceUrl: string;
  sourceKind: "OFFICIAL_GOV";
  fetchedAt: string;
  dataStatus: "LIVE_PARSED" | "SOURCE_UNAVAILABLE";
  rows: AuthorityRow[];
  totals: {
    shipCalls: number | null;
    cargoTons: number | null;
    containerTeu: number | null;
    authorities: number;
  };
  note: string;
};

type Props = {
  data: PortOverviewResponse;
  onCompany: (symbol: string) => void;
  onRegions: () => void;
};

type SortKey = "cargoTons" | "containerTeu" | "shipCalls" | "gtTotal";

function regionOf(name: string) {
  if (/Quảng Ninh|Hải Phòng|Thái Bình|Nam Định/i.test(name)) return "Bắc";
  if (/Thanh Hóa|Nghệ An|Hà Tĩnh|Quảng Bình|Quảng Trị|Huế|Đà Nẵng|Quảng Nam|Quảng Ngãi|Quy Nhơn|Nha Trang/i.test(name)) return "Trung";
  return "Nam";
}

function compact(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString("vi-VN");
}

function exact(v: number | null | undefined) {
  return v == null ? "—" : v.toLocaleString("vi-VN");
}

function Metric({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  return (
    <article className="paMetric">
      <span>{label}</span>
      <strong>{compact(value)}</strong>
      <small>{unit}</small>
    </article>
  );
}

export function PortAuthorityOverview({ data, onCompany, onRegions }: Props) {
  const [stats, setStats] = useState<NationalStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("cargoTons");

  useEffect(() => {
    let alive = true;
    fetch("/api/industry/ports/national-stats", { headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as NationalStats;
      })
      .then((x) => {
        if (!alive) return;
        setStats(x);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setStats(null);
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    return (stats?.rows ?? []).slice().sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      return (bv == null ? -1 : bv) - (av == null ? -1 : av);
    });
  }, [stats, sort]);

  const sourceUrl = stats?.sourceUrl ?? "https://vimawa.gov.vn/vi/noi-dung/tau-thuyen-ra-vao-cang-bien";

  return (
    <>
      <section className="portHero portPanel portOverviewHero paHero">
        <div>
          <span className="portEyebrow">INDUSTRY ENGINE · PORTS · NATIONAL OVERVIEW</span>
          <h2>Cảng biển Việt Nam</h2>
          <p>
            Tổng quan ngành ưu tiên dữ liệu <b>Cảng vụ chính thức</b>. Company, terminal, ownership và ship-call chi tiết được tách xuống các tab chuyên biệt.
          </p>
        </div>
        <div className="portHeroActions">
          <button onClick={onRegions}>Khám phá khu vực</button>
          <a className="portOverviewSourceBtn" href={sourceUrl} target="_blank" rel="noreferrer">VIMAWA ↗</a>
        </div>
      </section>

      <section className="portPanel paSummary">
        <div className="portSectionHead">
          <div><span className="portSectionIndex">00</span><h3>Toàn ngành · nguồn Cảng vụ</h3></div>
          <span className="portMuted">VIMAWA · OFFICIAL</span>
        </div>
        {!stats ? (
          <div className="portEmpty">{error ? `Không tải được dữ liệu official: ${error}` : "Đang tải dữ liệu Cảng vụ chính thức…"}</div>
        ) : stats.dataStatus !== "LIVE_PARSED" ? (
          <div className="portScopeNotice"><strong>Nguồn tạm thời chưa đọc được.</strong> {stats.note}</div>
        ) : (
          <>
            <div className="paMetricGrid">
              <Metric label="Tổng lượt tàu" value={stats.totals.shipCalls} unit="lượt" />
              <Metric label="Tổng hàng hóa" value={stats.totals.cargoTons} unit="tấn" />
              <Metric label="Container" value={stats.totals.containerTeu} unit="TEU" />
              <Metric label="Cảng vụ coverage" value={stats.totals.authorities} unit="đơn vị" />
            </div>
            <div className="paPolicy"><b>Data policy:</b> Aggregate trực tiếp từ bảng Cảng vụ VIMAWA. GT là Gross Tonnage; không đổi GT thành DWT và không dùng DWT làm sản lượng hàng hóa.</div>
          </>
        )}
      </section>

      <section className="portPanel paAuthorityPanel">
        <div className="portSectionHead paHead">
          <div><span className="portSectionIndex">01</span><h3>Hoạt động theo Cảng vụ</h3></div>
          <div className="paSort" aria-label="Sắp xếp bảng Cảng vụ">
            <button className={sort === "cargoTons" ? "active" : ""} onClick={() => setSort("cargoTons")}>Hàng hóa</button>
            <button className={sort === "containerTeu" ? "active" : ""} onClick={() => setSort("containerTeu")}>TEU</button>
            <button className={sort === "shipCalls" ? "active" : ""} onClick={() => setSort("shipCalls")}>Lượt tàu</button>
            <button className={sort === "gtTotal" ? "active" : ""} onClick={() => setSort("gtTotal")}>GT</button>
          </div>
        </div>

        {!rows.length ? (
          <div className="portEmpty">Chưa đọc được bảng Cảng vụ từ nguồn official.</div>
        ) : (
          <div className="paTableWrap">
            <table className="paTable">
              <thead>
                <tr><th>Cảng vụ</th><th>Vùng</th><th>Lượt tàu</th><th>GT</th><th>Hàng hóa</th><th>TEU</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const zeroTeu = r.containerTeu === 0;
                  return (
                    <tr key={r.authority}>
                      <td><strong>{r.authority}</strong></td>
                      <td><span className={`paRegion paRegion-${regionOf(r.authority)}`}>{regionOf(r.authority)}</span></td>
                      <td>{exact(r.shipCalls)}</td>
                      <td>{compact(r.gtTotal)}</td>
                      <td><b>{compact(r.cargoTons)}</b></td>
                      <td>
                        <span className={zeroTeu ? "paOfficialZero" : ""} title={zeroTeu ? "Nguồn VIMAWA công bố 0 TEU cho Cảng vụ này; hàng hóa có thể là hàng rời, hàng lỏng hoặc hàng tổng hợp không container." : undefined}>
                          {compact(r.containerTeu)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="paFootnote">
          <b>TEU = 0 không đồng nghĩa cảng không hoạt động.</b> Một Cảng vụ có thể có lượt tàu, GT và hàng hóa lớn nhưng không phát sinh container trong bảng official. Giá trị 0 được giữ nguyên nếu VIMAWA công bố 0; chỉ dữ liệu thiếu mới hiển thị “—”.
        </p>
      </section>

      <section className="portPanel">
        <div className="portSectionHead">
          <div><span className="portSectionIndex">02</span><h3>Doanh nghiệp cảng niêm yết</h3></div>
          <span className="portMuted">{data.companies.length} mã · verified registry</span>
        </div>
        <p className="portOverviewIntro">Universe để điều hướng sang tab Doanh nghiệp; không dùng KPI doanh nghiệp để đại diện National Overview.</p>
        <div className="portUniverseGrid">
          {data.companies.map((c) => (
            <button className="portUniverseCard" key={c.symbol} onClick={() => onCompany(c.symbol)}>
              <div className="portUniverseTop"><strong>{c.symbol}</strong><span>{c.exchange}</span><em>{c.locality}</em></div>
              <h4>{c.name}</h4>
              <p>{c.classificationLabel}</p>
              <small>{c.focus}</small>
              <div className="portUniverseFooter"><span>● Đã xác minh</span><b>Chi tiết →</b></div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
