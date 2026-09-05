import type { ProviderStatus, VNQuote } from "../types";

const fmt = new Intl.NumberFormat("vi-VN");

function productLabel(product: "bar" | "ring") {
  return product === "bar" ? "Vàng miếng" : "Nhẫn trơn 9999";
}

function officialUrl(brand: string, providers: ProviderStatus[]) {
  const provider = providers.find((x) => x.brand === brand);
  return provider?.url ?? provider?.homeUrl ?? null;
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
      <div className="vnSimpleHeader">
        <div>
          <div className="sectionTitle">Giá vàng Việt Nam</div>
          <div className="unit">VNĐ / lượng</div>
        </div>
      </div>

      <div className="vnDesktopTable">
        <table className="vnCompactTable">
          <thead>
            <tr>
              <th>Hãng</th>
              <th>Sản phẩm</th>
              <th className="buyHeader">Mua</th>
              <th className="sellHeader">Bán</th>
              <th>Link giá</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const url = officialUrl(row.brand, providers);

              return (
                <tr key={`${row.brand}-${row.product}-${index}`}>
                  <td>
                    <span className="vnBrandBadge">{row.brand}</span>
                  </td>
                  <td>
                    <span className="vnProductText">{productLabel(row.product)}</span>
                  </td>
                  <td className="buyValue">{fmt.format(row.buy)}</td>
                  <td className="sellValue">{fmt.format(row.sell)}</td>
                  <td>
                    {url ? (
                      <a
                        className="officialPriceLink"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Chính thức ↗
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="vnMobileList">
        {rows.map((row, index) => {
          const url = officialUrl(row.brand, providers);

          return (
            <article
              className="vnMobileItem"
              key={`${row.brand}-${row.product}-mobile-${index}`}
            >
              <div className="vnMobileTop">
                <div>
                  <div className="vnMobileBrand">{row.brand}</div>
                  <div className="vnMobileProduct">{productLabel(row.product)}</div>
                </div>

                {url && (
                  <a
                    className="vnBrandLink"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Chính thức ↗
                  </a>
                )}
              </div>

              <div className="vnMobilePrices">
                <div className="vnPriceCell buyCell">
                  <span>Mua</span>
                  <strong>{fmt.format(row.buy)}</strong>
                </div>

                <div className="vnPriceCell sellCell">
                  <span>Bán</span>
                  <strong>{fmt.format(row.sell)}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!rows.length && (
        <div className="empty">Chưa có dữ liệu giá vàng Việt Nam.</div>
      )}
    </section>
  );
}
