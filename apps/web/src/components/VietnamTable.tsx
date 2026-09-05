import type { ProviderStatus, VNQuote } from "../types";

const fmt = new Intl.NumberFormat("vi-VN");

function productLabel(product: "bar" | "ring") {
  return product === "bar" ? "Vàng miếng" : "Nhẫn trơn 9999";
}

function officialUrl(brand: string, providers: ProviderStatus[]) {
  const p = providers.find((x) => x.brand === brand);
  return p?.url ?? p?.homeUrl ?? null;
}

export function VietnamTable({
  rows,
  providers
}: {
  rows: VNQuote[];
  providers: ProviderStatus[];
}) {
  return (
    <section className="card vnSimpleCard">
      <div className="sectionTitle">Giá vàng Việt Nam</div>
      <div className="unit">VNĐ / lượng</div>

      <div className="vnDesktopTable">
        <table className="vnCompactTable">
          <thead>
            <tr>
              <th>Hãng</th>
              <th>Sản phẩm</th>
              <th>Mua</th>
              <th>Bán</th>
              <th>Nguồn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const url = officialUrl(r.brand, providers);
              return (
                <tr key={`${r.brand}-${r.product}-${i}`}>
                  <td><strong>{r.brand}</strong></td>
                  <td>{productLabel(r.product)}</td>
                  <td>{fmt.format(r.buy)}</td>
                  <td>{fmt.format(r.sell)}</td>
                  <td>
                    {url ? <a href={url} target="_blank" rel="noreferrer">Giá hãng ↗</a> : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="vnMobileList">
        {rows.map((r, i) => {
          const url = officialUrl(r.brand, providers);
          return (
            <article className="vnMobileItem" key={`${r.brand}-${r.product}-m-${i}`}>
              <div className="vnMobileTop">
                <div>
                  <div className="vnMobileBrand">{r.brand}</div>
                  <div className="vnMobileProduct">{productLabel(r.product)}</div>
                </div>
                {url && (
                  <a className="vnBrandLink" href={url} target="_blank" rel="noreferrer">
                    Giá hãng ↗
                  </a>
                )}
              </div>

              <div className="vnMobilePrices">
                <div className="vnPriceCell">
                  <span>Mua</span>
                  <strong>{fmt.format(r.buy)}</strong>
                </div>
                <div className="vnPriceCell">
                  <span>Bán</span>
                  <strong>{fmt.format(r.sell)}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!rows.length && <div className="empty">Chưa có dữ liệu giá vàng Việt Nam.</div>}
    </section>
  );
}
