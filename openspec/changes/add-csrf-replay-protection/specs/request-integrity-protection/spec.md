## ADDED Requirements

### Requirement: CSRF Protection for Submission Endpoint
The system MUST validate a server-issued CSRF token for each submission request.

#### Scenario: Missing or invalid token
- **WHEN** a submission request is sent without a valid CSRF token
- **THEN** the system rejects the request and does not modify any data

### Requirement: Replay Prevention with One-Time Nonce
The system MUST enforce one-time nonce validation for protected submission requests.

#### Scenario: Reused nonce is rejected
- **WHEN** a submission request reuses a previously consumed nonce
- **THEN** the system rejects the request as replayed

### Requirement: Request Origin Validation
The system MUST validate request origin metadata for protected submission requests.

#### Scenario: Untrusted origin is rejected
- **WHEN** request origin metadata does not match allowed origin policy
- **THEN** the system rejects the request
