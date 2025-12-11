# Project Context

## Purpose
A Google Apps Script web application for managing student preferences for Technical and Vocational College entrance surveys (四技二專甄選入學志願調查系統).
- **Students**: Log in via school email, fill out preferences (up to 6 choices), view results and statistics.
- **Teachers**: View class submission status and statistics.
- **Admins**: Manage data and settings via Google Sheets (config, student data, school choices, etc.), export CSVs.

## Tech Stack
- **Runtime**: Google Apps Script (V8 runtime)
- **Database**: Google Sheets
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (served via `HtmlService`)
- **Development**: Clasp (Command Line Apps Script Projects)

## Project Conventions

### Code Style
- **Backend (.gs)**: standard Apps Script patterns.
  - `main.gs`: Entry points (`doGet`, `doPost`), routing.
  - `retrieveData.gs`: Spreadsheet interactions.
  - `utilities.gs`: Helper functions.
  - `cache.gs`: Caching logic (ScriptCache).
- **Frontend (.html)**:
  - Standard HTML structure.
  - Server-side templating (scriptlets `<? ... ?>`).
  - Separate files for logic (`<script>`) and styles (`<style>`) recommended but currently often inline or mixed.

### Architecture Patterns
- **MVC-like**:
  - **Model**: Google Sheets (Data layer accessible via `SpreadsheetApp`).
  - **View**: HTML files served via `HtmlService`.
  - **Controller**: `.gs` scripts handling HTTP requests and business logic.
- **Caching**: Aggressive caching of static data (config, school lists) in `cache.gs` to mitigate GAS execution time limits and quotas.
- **Security**:
  - `X-Frame-Options: SAMEORIGIN`
  - Content Security Policy (CSP)
  - Input validation and HTML escaping

### Testing Strategy
- Manual testing via deployment as Web App.
- `onOpen` triggers for menu testing in Sheets.

### Git Workflow
- `master`/`main` reflects production code.
- Local development via `clasp push`.

## Domain Context
- **Education (Taiwan)**:
  - **統測 (Unified Entrance Exam)**: Standardized test for vocational schools.
  - **志願 (Preferences/Choices)**: Students select up to 6 departments/schools.
  - **群(類)別 (Group/Category)**: Study fields (e.g., Mechanical, Electrical).

## Important Constraints
- **GAS Quotas**: Daily email limits, execution time limits (6 mins/execution).
- **Sheet dependency**: Tightly coupled to specific Sheet names and structures (e.g., `configSheet`, `studentChoiceSheet`).

## External Dependencies
- **Google Services**: SpreadsheetApp, MailApp/GmailApp, CacheService, PropertiesService, Session.
- **Frontend libs**: (Check HTML files, possibly jQuery or simple DOM manipulation).
