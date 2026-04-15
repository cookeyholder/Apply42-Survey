## ADDED Requirements

### Requirement: Server-Side Role Authorization
The system MUST enforce role-based authorization on the server side for all sensitive data access and mutation functions.

#### Scenario: Unauthorized role is rejected
- **WHEN** a caller without required role invokes a protected function
- **THEN** the system rejects the request with a standardized authorization error

### Requirement: Do Not Trust Client Identity Context
The system MUST derive the effective user identity from server-side session context and SHALL NOT trust role identity provided by client parameters.

#### Scenario: Client-provided identity is ignored
- **WHEN** a client sends user or teacher identity fields in RPC parameters
- **THEN** the server ignores those fields and evaluates authorization from server session context only

### Requirement: Authorized Scope Enforcement
The system MUST enforce authorized resource scope for teacher-level queries.

#### Scenario: Teacher requests out-of-scope class data
- **WHEN** a teacher requests class data outside authorized class scope
- **THEN** the system denies access and records an authorization denial event
