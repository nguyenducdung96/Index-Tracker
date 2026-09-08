export type NationalPortAuthorityStat = {
  authority:string; shipCalls:number|null; gtTotal:number|null; domesticCalls:number|null; domesticGt:number|null;
  foreignCalls:number|null; foreignGt:number|null; inlandCalls:number|null; inlandCargoTons:number|null;
  cargoTons:number|null; containerTeu:number|null; passengers:number|null;
};
export type NationalPortStatsResponse = {
  provider:"VIMAWA"; sourceUrl:string; sourceKind:"OFFICIAL_GOV"; fetchedAt:string;
  dataStatus:"LIVE_PARSED"|"SOURCE_UNAVAILABLE"; rows:NationalPortAuthorityStat[];
  totals:{shipCalls:number|null;cargoTons:number|null;containerTeu:number|null;authorities:number};
  note:string;
};
const URL="https://vimawa.gov.vn/vi/noi-dung/tau-thuyen-ra-vao-cang-bien";
function clean(s:string){return s.replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim()}
function num(s:string):number|null { const x=clean(s).replace(/\./g,"").replace(/,/g,""); if(!x||!/^-?\d+(\.\d+)?$/.test(x))return null; const n=Number(x); return Number.isFinite(n)?n:null; }
export async function getNationalPortStats():Promise<NationalPortStatsResponse>{
  try{
    const r=await fetch(URL,{headers:{"user-agent":"MarketTracker/8.16 (+official-source-reader)"}}); if(!r.ok) throw new Error(`VIMAWA HTTP ${r.status}`);
    const html=await r.text(); const rows:NationalPortAuthorityStat[]=[];
    for(const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
      const cells=[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>clean(x[1]));
      if(cells.length<12 || !/^\d+$/.test(cells[0])) continue;
      rows.push({authority:cells[1],shipCalls:num(cells[2]),gtTotal:num(cells[3]),domesticCalls:num(cells[4]),domesticGt:num(cells[5]),foreignCalls:num(cells[6]),foreignGt:num(cells[7]),inlandCalls:num(cells[8]),inlandCargoTons:num(cells[9]),cargoTons:num(cells[10]),containerTeu:num(cells[11]),passengers:num(cells[12]??"")});
    }
    if(!rows.length) throw new Error("VIMAWA table format not recognized");
    const sum=(k:keyof NationalPortAuthorityStat)=>rows.reduce((a,x)=>a+(typeof x[k]==="number"?(x[k] as number):0),0);
    return {provider:"VIMAWA",sourceUrl:URL,sourceKind:"OFFICIAL_GOV",fetchedAt:new Date().toISOString(),dataStatus:"LIVE_PARSED",rows,totals:{shipCalls:sum("shipCalls"),cargoTons:sum("cargoTons"),containerTeu:sum("containerTeu"),authorities:rows.length},note:"Official VIMAWA table. Values are displayed in the source scope; no interpolation or terminal allocation."};
  }catch(e){return {provider:"VIMAWA",sourceUrl:URL,sourceKind:"OFFICIAL_GOV",fetchedAt:new Date().toISOString(),dataStatus:"SOURCE_UNAVAILABLE",rows:[],totals:{shipCalls:null,cargoTons:null,containerTeu:null,authorities:0},note:e instanceof Error?e.message:String(e)};}
}
export function getNationalPortSourceRegistry(){return {data:[
 {id:"vimawa-national",name:"VIMAWA · Tàu thuyền ra, vào cảng biển",organization:"Cục Hàng hải và Đường thủy Việt Nam",kind:"OFFICIAL_GOV",transport:"HTTP_HTML",cadence:"Theo công bố",status:"PRODUCTION",url:URL,coverage:"Cảng vụ, lượt tàu, GT, hàng hóa, TEU, hành khách"},
 {id:"vimawa-xlsx",name:"VIMAWA · Thống kê hàng hóa thông qua cảng",organization:"Cục Hàng hải và Đường thủy Việt Nam",kind:"OFFICIAL_GOV",transport:"XLSX",cadence:"Tháng",status:"SOURCE_VERIFIED",url:"https://www.vimawa.gov.vn/vi/thong-ke",coverage:"File thống kê official; parser XLSX/backfill là next step"},
 {id:"haiphong-plan",name:"Cảng vụ Hải Phòng · Kế hoạch điều động",organization:"Cảng vụ Hàng hải Hải Phòng",kind:"OFFICIAL_GOV",transport:"HTTP",cadence:"Trong ngày",status:"PRODUCTION",url:"https://cangvuhaiphong.gov.vn/",coverage:"Ship movement plan / DWT / terminal"},
 {id:"quynhon-plan",name:"Cảng vụ Quy Nhơn · Kế hoạch điều động",organization:"Cảng vụ Hàng hải Quy Nhơn",kind:"OFFICIAL_GOV",transport:"HTTP_HTML",cadence:"Hàng ngày",status:"PROTOTYPE_READY",url:"https://cangvuhanghaiquynhon.gov.vn/index.aspx?cat=2014&page=news",coverage:"Daily movement-plan archive"},
 {id:"quangninh-plan",name:"Cảng vụ Quảng Ninh · Kế hoạch điều động",organization:"Cảng vụ Hàng hải Quảng Ninh",kind:"OFFICIAL_GOV",transport:"HTTP_HTML",cadence:"Hàng ngày",status:"PROTOTYPE_READY",url:"https://kht1.cangvuhanghaiquangninh.gov.vn/",coverage:"Movement plan by port area"}
],serverTime:new Date().toISOString()};}
