## ADDED Requirements

### Requirement: Security Hardening Parent Program
The system SHALL provide a parent-level security hardening program that manages sub-proposals, milestones, dependencies, and acceptance gates.

#### Scenario: Parent plan defines sub-proposals
- **WHEN** the security hardening proposal set is created
- **THEN** the parent change includes an explicit list of sub-proposals and their scopes

#### Scenario: Parent plan defines execution gates
- **WHEN** sub-proposals are scheduled
- **THEN** the parent change defines priority gates for P0 before P1/P2 work

### Requirement: Cross-Proposal Completion Criteria
The system SHALL define shared completion criteria across all security sub-proposals, including acceptance checks and regression test expectations.

#### Scenario: Shared acceptance criteria are enforced
- **WHEN** a sub-proposal is marked complete
- **THEN** it satisfies the parent-defined acceptance and regression criteria
