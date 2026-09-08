# CareerDesk GitHub Copilot Instructions

- Project: CareerDesk (Career Preparation Workspace)
- Architecture: Single-Page Application using zero-dependency semantic HTML5, vanilla CSS3 (Aurora glassmorphism), and vanilla ES6+ JavaScript.
- Storage: Persistent client-side localStorage under key 'jobprep-dashboard-data-v2'.
- Numbers: Always format numbers using standard 0-9 digits in timers, analytics, and stats.
- Subject Management: Centralized via Settings Subject Manager. Use canonicalSubjectName(), masterSubjectList(), and syncAllSubjectSelects().
- Responsive Design: Mobile dock navigation. Inside button groups on mobile, scope span hiding to .cat-group-btn span only.
- Verification: Validate syntax with 'node --check assets/js/script.js'.
