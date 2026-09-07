# V8.11 Limitations

1. DWT is vessel design deadweight, not actual cargo tonnes or TEU.
2. Source records are official movement plans, not automatically treated as realized calls.
3. Backfill target is ~550 days. Availability depends on how far the official offset archive serves data.
4. YoY remains blank until the matching month from the previous year exists in D1.
5. Ownership percentages are only populated where an official document gives an explicit number.
6. VSC 74% VIP Greenport and 99.99% Nam Hai Dinh Vu are audited values as of 31/12/2024.
   Later narrative documents say VSC moved closer to 100% for Nam Hai Dinh Vu; V8.11 retains the audited number until a later audited table is parsed.
7. HAH 100% Hai An Port is sourced from Annual Report 2024; V8.11 does not silently roll the as-of date forward.
8. HTIT ownership percentage remains null because the official Port of Hai Phong website confirms member-company status but the exact legal ownership percentage has not been parsed from a direct official filing.
9. Share-of-tracked-DWT is not industry/TEU market share.
10. Carrier remains unresolved: ship agent is not assumed to be the shipping line.
