import type { PortCompany, PortEvent, PortMetric, PortOverviewResponse, PortSource } from "../../types.js";

const sources: PortSource[] = [
  {
    id: "php-annual",
    label: "Báo cáo thường niên Cảng Hải Phòng",
    organization: "CTCP Cảng Hải Phòng",
    url: "https://haiphongport.com.vn/vi/bao-cao-thuong-nien",
    sourceKind: "company-official",
    updateCadence: "Hàng năm",
    coverage: "cơ cấu, tài sản, sản lượng, chiến lược",
    status: "tracked"
  },
  {
    id: "php-financial",
    label: "Báo cáo tài chính Cảng Hải Phòng",
    organization: "CTCP Cảng Hải Phòng",
    url: "https://haiphongport.com.vn/vi/bao-cao-tai-chinh",
    sourceKind: "company-official",
    updateCadence: "Quý / bán niên / năm",
    coverage: "doanh thu, lợi nhuận, BCTC",
    status: "tracked"
  },
  {
    id: "php-news",
    label: "Tin tức & công bố Cảng Hải Phòng",
    organization: "CTCP Cảng Hải Phòng",
    url: "https://haiphongport.com.vn/vi/tin-tuc",
    sourceKind: "company-official",
    updateCadence: "Theo sự kiện",
    coverage: "sản lượng, terminal mới, tuyến/hãng tàu",
    status: "tracked"
  },
  {
    id: "maritime-admin",
    label: "Cục Hàng hải và Đường thủy Việt Nam",
    organization: "VIMAWA",
    url: "https://www.vimawa.gov.vn/",
    sourceKind: "official",
    updateCadence: "Theo công bố",
    coverage: "quản lý cảng biển, văn bản, dữ liệu hàng hải công khai",
    status: "manual",
    note: "Chưa xác nhận API public ổn định cho ship-call/DWT."
  },
  {
    id: "port-price",
    label: "Khung giá dịch vụ cảng biển",
    organization: "Cục Hàng hải và Đường thủy Việt Nam",
    url: "https://www.vimawa.gov.vn/vi/noi-dung/quy-dinh-co-che-chinh-sach-quan-ly-gia-dich-vu-tai-cang-bien-viet-nam-khung-gia-gia-dich-vu",
    sourceKind: "official",
    updateCadence: "Khi văn bản thay đổi",
    coverage: "khung giá bốc dỡ container, cầu bến, lai dắt, hoa tiêu",
    status: "tracked"
  },
  {
    id: "customs",
    label: "Thống kê Hải quan Việt Nam",
    organization: "Cơ quan Hải quan",
    url: "https://www.customs.gov.vn/",
    sourceKind: "official",
    updateCadence: "Định kỳ",
    coverage: "xuất nhập khẩu làm biến vĩ mô của ngành cảng",
    status: "pending-api",
    note: "V8.8 mới theo dõi nguồn; chưa normalize API/data file."
  }
];

const metrics: PortMetric[] = [
  {
    id: "php-throughput-2025",
    label: "PHP hàng hóa thông qua",
    value: 42.672,
    unit: "triệu tấn",
    period: "2025",
    yoyPct: 6.9,
    sourceId: "php-news",
    quality: "official",
    note: "Số liệu hợp nhất doanh nghiệp công bố."
  },
  {
    id: "php-teu-2025",
    label: "PHP container",
    value: 2.072,
    unit: "triệu TEU",
    period: "2025",
    yoyPct: 12.3,
    sourceId: "php-news",
    quality: "official"
  },
  {
    id: "php-revenue-2025",
    label: "PHP doanh thu",
    value: 3545,
    unit: "tỷ VND",
    period: "2025",
    yoyPct: 36.6,
    sourceId: "php-news",
    quality: "official",
    note: "Công bố doanh nghiệp tháng 01/2026."
  },
  {
    id: "php-pbt-2025",
    label: "PHP lợi nhuận trước thuế",
    value: 1280,
    unit: "tỷ VND",
    period: "2025",
    yoyPct: 6.7,
    sourceId: "php-news",
    quality: "official"
  }
];

const companies: PortCompany[] = [
  {
    symbol: "PHP",
    name: "Cảng Hải Phòng",
    region: "Bắc",
    focus: "Cụm cảng Hải Phòng; terminal thường + nước sâu Lạch Huyện.",
    terminals: ["Tân Vũ", "Chùa Vẽ", "Hoàng Diệu", "HTIT"],
    officialUrl: "https://haiphongport.com.vn/"
  },
  {
    symbol: "DVP",
    name: "Đầu tư và Phát triển Cảng Đình Vũ",
    region: "Bắc",
    focus: "Cảng container khu vực Đình Vũ, Hải Phòng.",
    terminals: ["Cảng Đình Vũ"],
    officialUrl: null
  },
  {
    symbol: "DXP",
    name: "Cảng Đoạn Xá",
    region: "Bắc",
    focus: "Khai thác cảng/logistics Hải Phòng.",
    terminals: ["Đoạn Xá"],
    officialUrl: null
  },
  {
    symbol: "GMD",
    name: "Gemadept",
    region: "Nam",
    focus: "Mạng lưới cảng và logistics Bắc–Nam; cảng nước sâu Gemalink.",
    terminals: ["Nam Đình Vũ", "Gemalink"],
    officialUrl: "https://www.gemadept.com.vn/"
  },
  {
    symbol: "VSC",
    name: "Container Việt Nam",
    region: "Bắc",
    focus: "Cảng container và logistics Hải Phòng.",
    terminals: ["Green Port", "VIP Green"],
    officialUrl: "https://viconship.com/"
  },
  {
    symbol: "PDN",
    name: "Cảng Đồng Nai",
    region: "Nam",
    focus: "Cảng tổng hợp/container khu vực Đồng Nai.",
    terminals: ["Đồng Nai"],
    officialUrl: "https://dongnai-port.com/"
  }
];

const events: PortEvent[] = [
  {
    date: "2025",
    title: "Bến số 3–4 Lạch Huyện được đưa vào khai thác",
    entity: "PHP / HTIT",
    kind: "capacity",
    sourceId: "php-news",
    note: "Mở rộng năng lực tiếp nhận tàu trọng tải lớn và công suất container."
  },
  {
    date: "14/12/2025",
    title: "Cảng Hải Phòng vượt mốc 2 triệu TEU/năm",
    entity: "PHP",
    kind: "operations",
    sourceId: "php-news"
  },
  {
    date: "23/04/2026",
    title: "ĐHĐCĐ 2026 xác nhận tăng trưởng sản lượng container 2025",
    entity: "PHP",
    kind: "financial",
    sourceId: "php-news"
  },
  {
    date: "01/07/2024",
    title: "Khung giá dịch vụ cảng biển mới",
    entity: "Ngành cảng",
    kind: "regulation",
    sourceId: "port-price",
    note: "Theo các quyết định 809/810/811/814 và Thông tư 12/2024."
  }
];

export function getPortOverview(): PortOverviewResponse {
  return {
    industry: "PORTS",
    scope: "MVP Hải Phòng/PHP + company map Việt Nam",
    asOf: "2026-09-08",
    metrics,
    companies,
    events,
    sources,
    limitations: [
      "DWT là trọng tải thiết kế của tàu, không phải khối lượng hàng thực tế bốc xếp; không dùng DWT × giá để suy doanh thu.",
      "V8.8 chưa có API public ổn định cho ship-call/DWT theo ngày từ Cảng vụ; phần này được đánh dấu pending thay vì tự scrape nguồn trả phí.",
      "KPI PHP 2025 là dữ liệu doanh nghiệp, không đại diện toàn bộ ngành cảng Việt Nam.",
      "Một số số liệu doanh nghiệp có thể khác nhau giữa thông cáo nhanh và BCTC kiểm toán; khi xung đột, pipeline sau sẽ ưu tiên BCTC/BC thường niên và lưu provenance.",
      "Company → terminal mapping ngoài PHP là seed để xây UI; cần xác minh ownership/operating rights trước khi dùng cho định giá."
    ],
    serverTime: new Date().toISOString()
  };
}

export function getPortSources() {
  return {
    data: sources,
    serverTime: new Date().toISOString()
  };
}
