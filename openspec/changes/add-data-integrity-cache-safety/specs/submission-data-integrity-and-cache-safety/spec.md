## ADDED Requirements

### Requirement: Unique Row Resolution Before Write
The system MUST resolve exactly one target row for each submission write operation.

#### Scenario: Non-unique row match is rejected
- **WHEN** the target identity matches zero rows or multiple rows
- **THEN** the system rejects the write operation and records a data integrity violation event

### Requirement: Server-Side Allowlist Validation for Choice Codes
The system MUST validate submitted choice codes against server-side allowlist rules before persisting data.

#### Scenario: Invalid code is rejected
- **WHEN** a submitted choice code is not in the allowed set for the applicant context
- **THEN** the system rejects the submission and does not persist invalid data

### Requirement: Collision-Resistant Cache Identity Key
The system MUST use collision-resistant identity keys for user cache entries.

#### Scenario: Cache identity mismatch is detected
- **WHEN** cached identity metadata does not match current user identity
- **THEN** the system invalidates the cache entry and rebuilds from source data
