# V8.11 Next Steps

## V8.12
- Parse actual TEU / cargo throughput from official company and authority disclosures.
- Normalize routes to a port/location master (country, UN/LOCODE when available).
- Build vessel/carrier master from verified sources; do not infer carrier from agent.
- Parse 2025 audited ownership tables for VSC/HAH/PHP-related entities to refresh as-of dates.
- Add capacity / actual-throughput separation and utilization only when definitions match.
- Research official data for Cái Mép / Vũng Tàu before adding a second regional collector.

## Data-quality work
- Add actual-vs-plan validation where post-event official records exist.
- Add data-break registry for changes in port-authority reporting scope.
- Preserve source URL, as-of date, relationship type and effective date for every ownership mapping.
