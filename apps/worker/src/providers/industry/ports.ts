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


export function getPortCompanyPortfolio(symbol:string) {
  if (symbol.toUpperCase() !== "GMD") return null;
  return {
    symbol:"GMD", name:"CTCP Gemadept", exchange:"HOSE", classification:"Đa cảng + Logistics", footprint:["Bắc","Trung","Nam"],
    summary:{assetCount:6,currentSystemCapacityTeu:5000000,berthLengthKm:3,note:"Gemadept công bố hệ thống 6 Cảng & ICD từ Bắc vào Nam, tổng công suất hiện tại khoảng 5 triệu TEU và khoảng 3 km cầu bến. Đây là system-level capacity, không phân bổ ngược cho từng asset khi nguồn không công bố."},
    assets:[
      {id:"nam-dinh-vu",name:"Cụm Cảng Nam Đình Vũ",region:"Bắc",locality:"Hải Phòng",type:"SEAPORT",typeLabel:"Seaport · Container",status:"OPERATING",role:"Cảng trọng tâm miền Bắc trong hệ sinh thái Cảng–Logistics Gemadept.",operator:"Gemadept",ownershipPct:null,capacityTeu:2000000,capacityTons:3000000,capacityComparator:"=",capacityNote:"Tổng công suất thiết kế 3 giai đoạn.",berthLengthM:1500,areaHa:65,maxDwt:48000,officialUrl:"https://ndv.gemadept.com.vn/",sourceLabel:"Gemadept · Cụm Cảng Nam Đình Vũ",sourceUrl:"https://www.gemadept.com.vn/cum-cang-nam-dinh-vu/",sourceAsOf:"2026-09-08",note:"7 cầu bến; không dùng capacity thiết kế làm actual throughput."},
      {id:"nam-hai-icd",name:"Nam Hải ICD",region:"Bắc",locality:"Hải Phòng",type:"ICD",typeLabel:"ICD · Logistics",status:"OPERATING",role:"ICD hậu phương, hỗ trợ giải tỏa áp lực cho hệ thống cảng Gemadept tại Hải Phòng.",operator:"Gemadept",ownershipPct:null,areaHa:21,officialUrl:"https://nhi.gemadept.com.vn/",sourceLabel:"Gemadept · Nam Hải ICD",sourceUrl:"https://www.gemadept.com.vn/nam-hai-icd/",sourceAsOf:"2026-09-08",note:"Không gán TEU capacity vì trang official được kiểm tra không công bố con số cùng scope."},
      {id:"dung-quat",name:"Cảng Gemadept Dung Quất",region:"Trung",locality:"Quảng Ngãi",type:"SEAPORT",typeLabel:"Seaport · General/Project cargo",status:"OPERATING",role:"Cảng miền Trung phục vụ khai thác cảng, port logistics và project logistics.",operator:"Gemadept",ownershipPct:null,officialUrl:"https://dqp.gemadept.com.vn/",sourceLabel:"Gemadept Dung Quất",sourceUrl:"https://dqp.gemadept.com.vn/",sourceAsOf:"2026-09-08",note:"Không ép dữ liệu hàng tổng hợp sang TEU."},
      {id:"phuoc-long",name:"Phước Long ICD",region:"Nam",locality:"TP.HCM",type:"ICD",typeLabel:"ICD · Floating port",status:"OPERATING",role:"ICD/cảng cửa khẩu quốc tế kết hợp depot, vận tải đa phương thức và khai thác cảng nổi.",operator:"Gemadept",ownershipPct:null,berthLengthM:350,areaHa:21,maxDwt:30000,startYear:1995,officialUrl:"https://pip.gemadept.com.vn/",sourceLabel:"Gemadept · Phước Long ICD",sourceUrl:"https://www.gemadept.com.vn/phuoc-long-icd/",sourceAsOf:"2026-09-08",note:"Khả năng khai thác 30.000 DWT nêu cho hệ thống cảng nổi; không coi là deep-sea terminal."},
      {id:"binh-duong",name:"Cảng Bình Dương",region:"Nam",locality:"Bình Dương",type:"RIVER_PORT",typeLabel:"River port · Container",status:"OPERATING",role:"Mắt xích hậu phương phía Nam, kết nối Cái Mép bằng vận tải thủy nội địa.",operator:"Gemadept",ownershipPct:null,berthLengthM:150,areaHa:17,startYear:2004,officialUrl:"https://www.gemadept.com.vn/en/binh-duong-port/",sourceLabel:"Gemadept · Binh Duong Port",sourceUrl:"https://www.gemadept.com.vn/en/binh-duong-port/",sourceAsOf:"2026-09-08",note:"Không đánh đồng vai trò với Gemalink deep-sea port."},
      {id:"gemalink",name:"Cảng nước sâu Gemalink",region:"Nam",locality:"Cái Mép – Thị Vải",type:"DEEP_SEA_PORT",typeLabel:"Deep-sea · Container",status:"EXPANDING",role:"Cửa ngõ nước sâu quốc tế, tiếp nhận mother vessel/mega-vessel.",operator:"Cai Mep Gemadept – Terminal Link",ownershipPct:75,partner:"CMA Terminals / CMA CGM",partnerOwnershipPct:25,capacityTeu:1500000,capacityComparator:"~",capacityNote:"Giai đoạn 1; GĐ2 khởi công 17/04/2026, sau hoàn thành tổng capacity >3 triệu TEU/năm.",areaHa:72,maxDwt:232494.5,startYear:2021,officialUrl:"https://gml.gemadept.com.vn/",sourceLabel:"Gemadept/Gemalink official",sourceUrl:"https://www.gemadept.com.vn/en/groundbreaking-for-gemalink-deep-sea-port-phase-2-elevating-the-status-of-an-international-trade-gateway/",sourceAsOf:"2026-09-08",note:"Ownership 75%/25% theo Gemadept official. Licensed vessel size 232,494.5 DWT từ 02/07/2025; các tài liệu thiết kế có thể nêu capability tới 250,000 DWT."}
    ],
    capacityEvents:[
      {id:"ndv-full",assetId:"nam-dinh-vu",date:"2025-09-30",label:"Nam Đình Vũ GĐ3 đi vào hoạt động",status:"ACTUAL",capacityTeu:2000000,comparator:">",note:"Gemadept mô tả tổng công suất cụm sau GĐ3 trên 2 triệu TEU/năm; registry asset giữ riêng design capacity 3 giai đoạn để không trộn scope.",sourceUrl:"https://www.gemadept.com.vn/gemadept-chinh-thuc-dua-giai-doan-3-cum-cang-nam-dinh-vu-vao-hoat-dong/"},
      {id:"gml-p1",assetId:"gemalink",date:"2021-01",label:"Gemalink GĐ1 vận hành",status:"ACTUAL",capacityTeu:1500000,comparator:"~",note:"GĐ1 bắt đầu vận hành tháng 01/2021.",sourceUrl:"https://gml.gemadept.com.vn/en/gemalink-port-licensed-to-receive-container-vessels-up-to-2324945-dwt/"},
      {id:"gml-p2",assetId:"gemalink",date:"2026-04-17",label:"Gemalink GĐ2 khởi công",status:"UNDER_CONSTRUCTION",capacityTeu:3000000,comparator:">",note:"Sau hoàn thành GĐ2, tổng công suất Gemalink vượt 3 triệu TEU/năm.",sourceUrl:"https://www.gemadept.com.vn/en/groundbreaking-for-gemalink-deep-sea-port-phase-2-elevating-the-status-of-an-international-trade-gateway/"}
    ],
    relatedAssets:[{name:"SCSC",type:"AIR_CARGO",note:"Air cargo terminal thuộc hệ sinh thái liên quan; không đưa vào Port & ICD TEU peer comparison.",officialUrl:"https://www.gemadept.com.vn/en/services/port-operation/"}],
    methodology:["Company page = asset portfolio; operating intelligence chi tiết thuộc Terminal page.","PORT/ICD/RIVER/DEEP-SEA/AIR-CARGO được giữ type riêng; không so sánh capacity máy móc.","Không suy ownership %, capacity hoặc throughput khi official source không công bố cùng scope.","System capacity không được phân bổ ngược cho từng terminal.","DWT không phải cargo throughput/TEU."],
    sources:[
      {label:"Gemadept · Port operation",url:"https://www.gemadept.com.vn/en/services/port-operation/",asOf:"2026-09-08"},
      {label:"Gemadept · Nam Đình Vũ",url:"https://www.gemadept.com.vn/cum-cang-nam-dinh-vu/",asOf:"2026-09-08"},
      {label:"Gemadept · Gemalink Phase 2",url:"https://www.gemadept.com.vn/en/groundbreaking-for-gemalink-deep-sea-port-phase-2-elevating-the-status-of-an-international-trade-gateway/",asOf:"2026-09-08"},
      {label:"Gemalink · vessel licence / ownership",url:"https://gml.gemadept.com.vn/en/gemalink-port-licensed-to-receive-container-vessels-up-to-2324945-dwt/",asOf:"2026-09-08"}
    ], serverTime:new Date().toISOString()
  };
}
