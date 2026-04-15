## ADDED Requirements

### Requirement: Structured Security Audit Events
The system MUST emit structured security audit events for sensitive operations.

#### Scenario: Authorization denial is logged
- **WHEN** a protected operation is denied by authorization policy
- **THEN** the system records an audit event with actor, action, resource, result, and reason

### Requirement: Sensitive Data Safe Logging
The system MUST prevent sensitive payload data from being logged in plain form.

#### Scenario: Request payload contains personal data
- **WHEN** request context is logged for diagnostics
- **THEN** sensitive fields are masked or removed before logging

### Requirement: Throttling for Sensitive Endpoints
The system MUST enforce throttling controls on high-risk endpoints.

#### Scenario: Excessive submission requests
- **WHEN** request rate exceeds configured threshold
- **THEN** the system throttles subsequent requests and records a security event
