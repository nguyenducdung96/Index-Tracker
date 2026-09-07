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
    status: "tracked",
    note: "V8.9 dùng CSDL kế hoạch điều động tàu Hải Phòng làm official ship-plan feed; dữ liệu được gắn planned-movement."
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

const metrics: PortMetric[] = [];

/*
 * V8.14 listed-port universe.
 * Classification is deliberately explicit so a port operator, a multi-port
 * logistics group and a holding company are not presented as equivalent.
 * Exchange status is sourced from HNX/HOSE/VSDC profiles or official issuer
 * disclosures; company websites are used as the operating-company link.
 */
const companies: PortCompany[] = [
  {symbol:"PHP",name:"CTCP Cảng Hải Phòng",exchange:"UPCOM",region:"Bắc",locality:"Hải Phòng",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác hệ thống cảng Hải Phòng và tham gia bến nước sâu Lạch Huyện.",terminals:["Tân Vũ","Chùa Vẽ","Hoàng Diệu","HTIT"],officialUrl:"https://haiphongport.com.vn/",exchangeSourceUrl:"https://hnx.vn/vi-vn/ModuleIssuer/UC_Issuer/Details/PHP/UC",verifiedAsOf:"2026-09-08"},
  {symbol:"VGR",name:"CTCP Cảng Xanh VIP",exchange:"UPCOM",region:"Bắc",locality:"Hải Phòng",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác VIP Green Port tại khu vực Đình Vũ – Cát Hải.",terminals:["VIP Green Port"],officialUrl:"https://vipgreenport.com.vn/",exchangeSourceUrl:"https://upcom.hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-etf-vgr.html",verifiedAsOf:"2026-09-08"},
  {symbol:"DVP",name:"CTCP Đầu tư và Phát triển Cảng Đình Vũ",exchange:"HOSE",region:"Bắc",locality:"Hải Phòng",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác Cảng Đình Vũ.",terminals:["Cảng Đình Vũ"],officialUrl:"https://dinhvuport.com.vn/",exchangeSourceUrl:"https://www.dinhvuport.com.vn/",verifiedAsOf:"2026-09-08"},
  {symbol:"DXP",name:"CTCP Cảng Đoạn Xá",exchange:"HNX",region:"Bắc",locality:"Hải Phòng",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác cảng và dịch vụ logistics tại Hải Phòng.",terminals:["Đoạn Xá"],officialUrl:"https://doanxaport.com.vn/",exchangeSourceUrl:"https://hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-ny-dxp.html",verifiedAsOf:"2026-09-08"},
  {symbol:"PSP",name:"CTCP Cảng Dịch vụ Dầu khí Đình Vũ",exchange:"UPCOM",region:"Bắc",locality:"Hải Phòng",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Cảng dịch vụ dầu khí và hàng tổng hợp tại Đình Vũ.",terminals:["PTSC Đình Vũ"],officialUrl:"http://www.ptscdinhvu.com.vn/",exchangeSourceUrl:"https://www.hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-uc-psp.html",verifiedAsOf:"2026-09-08"},
  {symbol:"CQN",name:"CTCP Cảng Quảng Ninh",exchange:"UPCOM",region:"Bắc",locality:"Quảng Ninh",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác cảng tại khu vực Quảng Ninh/Cái Lân.",terminals:["Cảng Quảng Ninh"],officialUrl:null,exchangeSourceUrl:"https://hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-uc-CQN.html",verifiedAsOf:"2026-09-08"},
  {symbol:"NAP",name:"CTCP Cảng Nghệ Tĩnh",exchange:"HNX",region:"Trung",locality:"Nghệ An",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác hệ thống cảng khu vực Nghệ An – Hà Tĩnh.",terminals:["Cửa Lò","Bến Thủy"],officialUrl:"http://nghetinhport.com.vn/",exchangeSourceUrl:"https://www.hnx.vn/vi-vn/m-tim-kiem-NAP.html",verifiedAsOf:"2026-09-08"},
  {symbol:"CDN",name:"CTCP Cảng Đà Nẵng",exchange:"HNX",region:"Trung",locality:"Đà Nẵng",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác cảng biển khu vực Đà Nẵng.",terminals:["Tiên Sa"],officialUrl:"https://danangport.com/",exchangeSourceUrl:"https://hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-ny-cdn.html",verifiedAsOf:"2026-09-08"},
  {symbol:"QNP",name:"CTCP Cảng Quy Nhơn",exchange:"HOSE",region:"Trung",locality:"Quy Nhơn",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác Cảng Quy Nhơn.",terminals:["Cảng Quy Nhơn"],officialUrl:"https://quynhonport.vn/",exchangeSourceUrl:"https://vsdc.vn/vi/ad/196872",verifiedAsOf:"2026-09-08"},
  {symbol:"QSP",name:"CTCP Tân Cảng Quy Nhơn",exchange:"UPCOM",region:"Trung",locality:"Quy Nhơn",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác Tân Cảng Quy Nhơn.",terminals:["Tân Cảng Quy Nhơn"],officialUrl:"http://quynhonnewport.vn/",exchangeSourceUrl:"https://www.hnx.vn/vi-vn/m-tim-kiem-QSP.html",verifiedAsOf:"2026-09-08"},
  {symbol:"PDN",name:"CTCP Cảng Đồng Nai",exchange:"HOSE",region:"Nam",locality:"Đồng Nai",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Khai thác cảng tổng hợp/container tại Đồng Nai.",terminals:["Cảng Đồng Nai"],officialUrl:"https://dongnai-port.com/",exchangeSourceUrl:"https://dongnai-port.com/",verifiedAsOf:"2026-09-08"},
  {symbol:"PAP",name:"CTCP Dầu khí Đầu tư Khai thác Cảng Phước An",exchange:"UPCOM",region:"Nam",locality:"Đồng Nai",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Đầu tư và khai thác Cảng Phước An.",terminals:["Cảng Phước An"],officialUrl:"https://pap.vn/",exchangeSourceUrl:"https://www.hnx.vn/vi-vn/m-tim-kiem-PAP.html",verifiedAsOf:"2026-09-08"},
  {symbol:"SGP",name:"CTCP Cảng Sài Gòn",exchange:"UPCOM",region:"Nam",locality:"TP.HCM",classification:"DIRECT_PORT",classificationLabel:"Cảng trực tiếp",focus:"Hệ thống cảng và dịch vụ hàng hải khu vực TP.HCM.",terminals:["Cảng Sài Gòn"],officialUrl:"https://saigonport.vn/",exchangeSourceUrl:"https://www.hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-uc-sgp.html",verifiedAsOf:"2026-09-08"},
  {symbol:"GMD",name:"CTCP Gemadept",exchange:"HOSE",region:"Nam",locality:"Đa vùng",classification:"MULTI_PORT_LOGISTICS",classificationLabel:"Đa cảng + Logistics",focus:"Mạng lưới cảng và logistics Bắc–Nam, gồm Nam Đình Vũ và Gemalink.",terminals:["Nam Đình Vũ","Gemalink"],officialUrl:"https://www.gemadept.com.vn/",exchangeSourceUrl:"https://www.gemadept.com.vn/",verifiedAsOf:"2026-09-08"},
  {symbol:"VSC",name:"CTCP Container Việt Nam",exchange:"HOSE",region:"Bắc",locality:"Hải Phòng",classification:"MULTI_PORT_LOGISTICS",classificationLabel:"Cảng + Logistics",focus:"Hệ sinh thái cảng container và logistics tại Hải Phòng.",terminals:["Green Port","VIP Green","Nam Hải Đình Vũ"],officialUrl:"https://viconship.com/",exchangeSourceUrl:"https://vsdc.vn/vi/ad/171073",verifiedAsOf:"2026-09-08"},
  {symbol:"HAH",name:"CTCP Vận tải và Xếp dỡ Hải An",exchange:"HOSE",region:"Bắc",locality:"Hải Phòng",classification:"RELATED_PORT_SHIPPING",classificationLabel:"Shipping + Port",focus:"Vận tải container kết hợp khai thác cảng Hải An.",terminals:["Cảng Hải An"],officialUrl:"https://haiants.vn/",exchangeSourceUrl:"https://haiants.vn/",verifiedAsOf:"2026-09-08"},
  {symbol:"MVN",name:"Tổng công ty Hàng hải Việt Nam - CTCP",exchange:"UPCOM",region:"Bắc",locality:"Toàn quốc",classification:"HOLDING_PORT_NETWORK",classificationLabel:"Holding hệ cảng",focus:"Holding hàng hải có hệ thống doanh nghiệp cảng và vận tải trên toàn quốc.",terminals:[],officialUrl:"https://vimc.co/",exchangeSourceUrl:"https://www.hnx.vn/vi-vn/cophieu-etfs/chi-tiet-chung-khoan-uc-mvn.html",verifiedAsOf:"2026-09-08"}
];

const regionCoverage = [
  {id:"haiphong",label:"Hải Phòng",macroRegion:"Bắc" as const,status:"live" as const,detail:"Official ship-plan collector đang chạy; terminal/DWT normalization đã có.",officialUrl:"https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx?d=0"},
  {id:"quangninh",label:"Quảng Ninh",macroRegion:"Bắc" as const,status:"source-found" as const,detail:"Đã xác định nguồn Cảng vụ/issuer chính thức; chưa production collector.",officialUrl:"https://www.cangvuhanghaiquangninh.gov.vn/"},
  {id:"danang",label:"Đà Nẵng",macroRegion:"Trung" as const,status:"research" as const,detail:"Universe doanh nghiệp đã xác minh; collector vận hành chưa triển khai.",officialUrl:null},
  {id:"quynhon",label:"Quy Nhơn",macroRegion:"Trung" as const,status:"source-found" as const,detail:"Đã xác định nguồn kế hoạch điều động tàu Cảng vụ; chưa production collector.",officialUrl:"https://cangvuhanghaiquynhon.gov.vn/"},
  {id:"dongnai",label:"Đồng Nai",macroRegion:"Nam" as const,status:"research" as const,detail:"PDN/PAP đã vào universe; dữ liệu Cảng vụ cần chuẩn hóa phạm vi trước khi ingest.",officialUrl:null},
  {id:"hcm-caimep",label:"TP.HCM / Cái Mép",macroRegion:"Nam" as const,status:"source-found" as const,detail:"Đã xác định nguồn điều động tàu khu vực Vũng Tàu/Cái Mép; chưa production collector.",officialUrl:"https://cangvuhanghaivungtau.gov.vn/"}
];

const events: PortEvent[] = [
  {date:"01/07/2024",title:"Khung giá dịch vụ cảng biển mới có hiệu lực",entity:"Ngành cảng Việt Nam",kind:"regulation",sourceId:"port-price",note:"Theo hệ thống văn bản quản lý giá dịch vụ cảng biển; cần theo dõi effective date khi pricing monitor được triển khai."},
  {date:"2025",title:"Bến 3–4 Lạch Huyện đi vào khai thác",entity:"Cụm cảng Hải Phòng",kind:"capacity",sourceId:"php-news",note:"Bổ sung năng lực cảng nước sâu tại Hải Phòng; event ngành/khu vực, không dùng làm KPI tổng quan PHP."},
  {date:"30/09/2025",title:"Giai đoạn 3 Nam Đình Vũ đi vào hoạt động",entity:"Cụm cảng Hải Phòng",kind:"capacity",sourceId:"php-news",note:"Mở rộng capacity của cụm Nam Đình Vũ; số liệu chi tiết nằm ở Company/Terminal layer."}
];

export function getPortOverview(): PortOverviewResponse {
  return {
    industry:"PORTS",
    scope:"Vietnam listed-port universe + regional data coverage",
    asOf:"2026-09-08",
    metrics,
    companies,
    events,
    sources,
    regionCoverage,
    limitations:[
      "Tổng quan V8.14 không hiển thị KPI riêng PHP và không lặp stock-watchlist; dữ liệu doanh nghiệp nằm ở Company layer.",
      "DIRECT_PORT, MULTI_PORT_LOGISTICS, HOLDING_PORT_NETWORK và RELATED_PORT_SHIPPING là các nhóm khác nhau; không dùng universe này như một peer set định giá tự động.",
      "Chỉ Hải Phòng hiện có production ship-plan collector. Các khu vực khác chỉ hiển thị source coverage cho đến khi collector được kiểm chứng.",
      "DWT là proxy quy mô tàu, không phải actual cargo/TEU. Actual, estimate và target phải giữ nhãn riêng.",
      "Universe là danh sách đã xác minh theo nguồn chính thức/issuer tại thời điểm as-of; sẽ tiếp tục mở rộng khi tìm thấy mã phù hợp và xác minh hoạt động cảng trực tiếp."
    ],
    serverTime:new Date().toISOString()
  };
}

export function getPortSources() {
  return {
    data: sources,
    serverTime: new Date().toISOString()
  };
}
