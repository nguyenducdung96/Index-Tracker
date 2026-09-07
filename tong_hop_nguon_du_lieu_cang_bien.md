# TỔNG HỢP NGUỒN DỮ LIỆU & API MIỄN PHÍ XÂY DỰNG WEBSITE CẢNG BIỂN

Tài liệu tổng hợp toàn bộ các nguồn dữ liệu công khai, API miễn phí (AIS Tracking, lịch tàu, chỉ số cước biển, sản lượng thông quan) phục vụ việc thu thập dữ liệu (ETL / Data Scraping) và phát triển nền tảng theo dõi dữ liệu cảng biển & logistics tương tự `dulieucangbien.com`.

---

## 1. Dữ liệu AIS Vị trí tàu Realtime (Tracking & Telemetry)

Các nguồn cung cấp tọa độ tàu, nhận dạng (MMSI, IMO, Tên), tốc độ, hướng đi và tình trạng hành hải:

* **AISStream.io (Đề xuất tốt nhất)**
  * **Link:** [https://aisstream.io/](https://aisstream.io/)
  * **Hình thức:** Free WebSocket API (chỉ cần đăng ký tài khoản lấy API Key).
  * **Dữ liệu:** Tọa độ GPS thời gian thực, thông số nhận dạng tàu, tốc độ, góc bẻ lái, đích đến (Destination), giờ ETA. Có hỗ trợ lọc bounding box theo tọa độ phao số 0 / vùng biển Việt Nam.
* **Datalastic**
  * **Link:** [https://datalastic.com/](https://datalastic.com/)
  * **Hình thức:** REST API (Free/Starter tier).
  * **Dữ liệu:** Tra cứu thông số kỹ thuật tàu, tình trạng cập cảng (Port Calls), vị trí cảng biển toàn cầu theo mã UN/LOCODE.
* **AISHub**
  * **Link:** [https://www.aishub.net/](https://www.aishub.net/)
  * **Hình thức:** REST API / Raw Feed (Miễn phí 100%).
  * **Điều kiện:** Cung cấp API miễn phí không giới hạn nếu bạn đóng góp 1 trạm thu sóng AIS (anten + Raspberry Pi) chia sẻ dữ liệu vào mạng lưới cộng đồng.
* **Widget bản đồ MarineTraffic & VesselFinder**
  * **Link MarineTraffic:** [https://www.marinetraffic.com/](https://www.marinetraffic.com/)
  * **Link VesselFinder:** [https://www.vesselfinder.com/](https://www.vesselfinder.com/)
  * **Hình thức:** Nhúng iframe widget trực tiếp vào trang web. Phù hợp để hiển thị radar theo dõi tàu neo đậu tại các luồng Cái Mép, Cát Lái, Hải Phòng mà không cần backend xử lý tọa độ.

---

## 2. Dữ liệu Lịch tàu & Kế hoạch Điều động Cầu bến Nội địa (Web Scraping)

Các cơ quan quản lý và đơn vị khai thác cảng tại Việt Nam công khai danh sách tàu cập/rời cảng hàng ngày trên giao diện web (HTML tĩnh/AJAX), rất thuận tiện để viết cron job cào dữ liệu định kỳ (15–30 phút/lần):

* **Cảng vụ Hàng hải Hải Phòng (Thông báo tàu đến/rời cảng)**
  * **Link:** [https://cangvuhaiphong.gov.vn/thong-bao-tau-den-cang/](https://cangvuhaiphong.gov.vn/thong-bao-tau-den-cang/)
  * **Dữ liệu:** Danh sách tàu đến phao số 0, thời gian dự kiến cập bến (ETA), mớn nước, trọng tải, cầu bến neo đậu (Lạch Huyện, Tân Vũ, Đình Vũ, Nam Hải...).
* **Hệ thống ePort - Tổng công ty Tân Cảng Sài Gòn (SNP)**
  * **Link:** [https://eport.saigonnewport.com.vn/](https://eport.saigonnewport.com.vn/)
  * **Dữ liệu:** Lịch trình cập bến cụ thể của các tàu container tại cụm cảng lớn nhất nước: Tân Cảng Cát Lái, Cái Mép - Thị Vải (TCIT, TCTT).
* **Công ty Cổ phần Cảng Hải Phòng**
  * **Link:** [https://haiphongport.com.vn/vi/tra-cuu-lich-tau](https://haiphongport.com.vn/vi/tra-cuu-lich-tau)
  * **Dữ liệu:** Lịch tàu làm hàng container và hàng rời cập cầu Hoàng Diệu, Chùa Vẽ, Tân Vũ.
* **Cảng Đình Vũ**
  * **Link:** [https://www.dinhvuport.com.vn/](https://www.dinhvuport.com.vn/)
  * **Dữ liệu:** Lịch tàu cập bến Đình Vũ, tra cứu số cont, tình trạng bãi.
* **Cổng thông tin một cửa quốc gia (VNSW)**
  * **Link:** [https://vnsw.gov.vn/](https://vnsw.gov.vn/)
  * **Dữ liệu:** Thông tin thủ tục khai báo tàu biển xuất/nhập cảnh tại các cảng vụ hàng hải trên phạm vi toàn quốc.

---

## 3. Chỉ số Cước Vận tải Biển & Giá Thuê Tàu (Freight Rates & Indices)

Dữ liệu quan trọng nhất phục vụ phân tích xu hướng biên lợi nhuận của các doanh nghiệp cảng và hãng tàu (HAH, GMD, VSC...):

* **SCFI & CCFI (Shanghai Shipping Exchange - SSE)**
  * **Link:** [https://en.sse.net.cn/indices/scfinew.jsp](https://en.sse.net.cn/indices/scfinew.jsp)
  * **Đặc điểm:** Chỉ số cước container xuất khẩu Thượng Hải / Trung Quốc. Cập nhật vào **15:00 chiều thứ Sáu hàng tuần**. Là chỉ số benchmark quan trọng nhất cho giá cước giao ngay (Spot Rate).
* **Drewry World Container Index (WCI)**
  * **Link:** [https://www.drewry.co.uk/trackers-and-indices/equity-research-trackers](https://www.drewry.co.uk/trackers-and-indices/equity-research-trackers)
  * **Đặc điểm:** Chỉ số tổng hợp giá cước container cho 8 tuyến vận tải chính trên thế giới, công khai dữ liệu tổng quan vào **thứ Năm hàng tuần**.
* **Baltic Dry Index (BDI - Cước tàu hàng rời)**
  * **Link:** [https://www.tradingview.com/symbols/INDEX-BDI/](https://www.tradingview.com/symbols/INDEX-BDI/)
  * **Đặc điểm:** Chỉ số giá cước vận tải hàng rời (than, quặng, ngũ cốc). Có thể tích hợp thông qua thư viện TradingView Lightweight Charts (mã nguồn mở) hoặc nhúng widget biểu đồ miễn phí.
* **HARPEX (Harper Petersen Charter Rates Index)**
  * **Link:** [https://www.harperpetersen.com/harpex](https://www.harperpetersen.com/harpex)
  * **Đặc điểm:** Chỉ số đo lường giá thuê tàu container định hạn theo từng cỡ tàu (TEU), cập nhật hàng tuần.
* **Freightos Baltic Index (FBX)**
  * **Link:** [https://www.freightos.com/freight-resources/freightos-baltic-index/](https://www.freightos.com/freight-resources/freightos-baltic-index/)
  * **Đặc điểm:** Chỉ số cước container giao ngay theo thời gian thực (realtime/daily) từ mạng lưới sàn giao dịch cước vận tải.

---

## 4. Báo cáo Sản lượng & Vĩ mô Hàng hải Việt Nam

* **Cục Hàng hải Việt Nam (Vinamarine)**
  * **Link:** [https://vinamarine.gov.vn/](https://vinamarine.gov.vn/)
  * **Dữ liệu:** Báo cáo định kỳ hàng tháng/quý về sản lượng hàng hóa thông qua hệ thống cảng biển Việt Nam (tổng sản lượng tấn, lượng container TEU, phân chia theo từng khu vực cảng).
* **Tổng cục Hải quan Việt Nam**
  * **Link:** [https://customs.gov.vn/](https://customs.gov.vn/)
  * **Dữ liệu:** Thống kê kim ngạch xuất nhập khẩu sơ bộ kỳ 1 (giữa tháng) và kỳ 2 (cuối tháng), khối lượng hàng hóa xuất nhập khẩu theo từng nhóm hàng chính.

---

## 5. Kiến trúc Công nghệ Đề xuất (Tech Stack)

```
[ Data Collection Layer ]
  ├── WebSocket Client (Python `websockets`)  --> AISStream.io (Tọa độ tàu)
  ├── Scraper Bots (`playwright` / `bs4`)    --> Lịch tàu Cảng vụ, ePort SNP
  └── Weekly Cron Job (Python `requests`)    --> SSE (SCFI), Drewry (WCI), Harpex
              │
              ▼
[ Storage Layer ]
  ├── PostgreSQL + PostGIS (Lưu thông tin tàu, bến cảng, truy vấn không gian)
  └── TimescaleDB (Lưu chuỗi thời gian lịch sử giá cước SCFI, BDI...)
              │
              ▼
[ API & Frontend Layer ]
  ├── Backend: FastAPI (Python) hoặc NestJS / Go
  ├── Frontend: Next.js + Tailwind CSS
  └── Charts / Maps: Leaflet.js / Mapbox GL + TradingView Lightweight Charts
```