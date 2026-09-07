# V8.9 — Hai Phong Port Intelligence Requirements

## Goal
Move the Port module from static MVP to an official-source operational data pipeline for Hai Phong.

## Official feed
Primary source:
https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx?d=0

Owner: Cảng vụ Hàng hải Hải Phòng.

Fields parsed for arrival/departure/internal movement:
- plan date/time
- vessel name
- draft
- LOA
- DWT
- GT
- channel
- origin / destination
- agent
- pilot

## Data convention
- `ARRIVAL` into a normalized terminal is the primary ship-call record.
- Departure DWT is NOT added again to terminal throughput proxy.
- Internal movement is stored for route/operations analysis but is not counted as a new external ship call by default.
- Source status is `PORT_AUTHORITY_MOVEMENT_PLAN` / `planned-movement`.
- DWT is vessel deadweight capacity, NOT actual cargo handled.

## V8.9 UI
- Hai Phong dashboard: 30-day DWT, ship calls, average/max DWT, daily DWT, top terminals.
- Terminal dashboard: selector, 90-day KPI, daily/monthly DWT, top origins, recent vessel calls, terminal DWT capability.
- PHP dashboard remains available.
- Existing Gold / Stocks / Watchlist / Stock Detail must remain unchanged.

## Tracked terminal aliases
HTIT, HICT, HHIT, Tân Vũ, Chùa Vẽ, Hoàng Diệu, Đình Vũ, Nam Đình Vũ,
Nam Hải Đình Vũ, VIP Green, Green Port, Hải An, Đoạn Xá, PTSC Đình Vũ,
VIMC Đình Vũ, Nam Hải, EURO Đình Vũ, Tân Cảng 189, Lạch Huyện 2,
MPC Port, Transvina, Cảng 128, VIMC.
