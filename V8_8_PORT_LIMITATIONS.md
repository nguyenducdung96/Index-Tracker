# V8.8 Port Industry — Known Limitations

1. No official stable public API for ship-call/DWT has been connected yet.
   The HTIT daily DWT / vessel list is intentionally not fabricated.

2. No paid-source scraping.
   Screenshots from paid sites are used only to understand product/UX structure,
   not as a production data feed.

3. DWT is vessel deadweight capacity, not cargo actually handled.
   It is an operating proxy only.

4. Revenue/financial values can differ between flash announcements,
   consolidated statements, separate statements and audited filings.
   V8.8 stores only a small curated official snapshot.
   Future pipeline must preserve source + period + statement scope.

5. Company-terminal mapping for non-PHP names is an initial UI seed.
   Ownership, operating rights and economic interest must be verified before
   using the mapping in valuation.

6. Customs/import-export data source is tracked but not yet normalized.

7. V8.8 does not require a D1 migration.
   The current port MVP is configuration-backed so deployment cannot break the
   existing Gold/Stocks database. D1 industry tables should be introduced only
   when the ship/financial ingestion pipeline is ready.
