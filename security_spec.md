# Security Specification - Hamrah

## Data Invariants
1. A ServiceRequest must have a customerId matching the creator's UID.
2. A Negotiation must be linked to an existing ServiceRequest.
3. Only the customer who created a ServiceRequest can assign a provider to it.
4. A CivicIssue can only be upvoted once per user.
5. Users cannot modify their own roles in the User collection.
6. ServiceRequest status can only transition in a logical order (pending -> negotiating -> in_progress -> completed).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a `ServiceRequest` with a `customerId` belonging to another user.
2. **Role Escalation**: Attempt to update own `User` profile to set `role: 'admin'`.
3. **Price Manipulation**: A provider attempts to update `finalPricePKR` on a `ServiceRequest` they are not assigned to.
4. **State Shortcutting**: Attempt to update a `ServiceRequest` status from `pending` directly to `completed`.
5. **Upvote Spam**: Attempt to create multiple `Upvote` documents for the same `issueId` by the same `userId`.
6. **Malicious ID**: Attempt to create a document with a 2KB long string as ID.
7. **Ghost Fields**: Attempt to add `isVerified: true` to a `User` profile update.
8. **PII Leak**: An unauthenticated user attempts to read all `User` profiles.
9. **Orphaned Negotiation**: Attempt to create a `Negotiation` for a non-existent `requestId`.
10. **Improper Status Update**: A provider attempts to cancel a `ServiceRequest` they don't own.
11. **Negative Price**: Attempt to set `initialOfferPKR` to `-500`.
12. **Huge Payload**: Attempt to post a `CivicIssue` description longer than 2000 characters.

## Test Runner (firestore.rules.test.ts)
[To be implemented after rules draft]
