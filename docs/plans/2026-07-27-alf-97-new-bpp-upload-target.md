# ALF-97 New BPP Upload Target

**Goal:** Close the M3 gap where upload can only target existing BPPs.

**Decision:** Add two explicit modes to the existing mock upload form. `BPP baru` requires a trimmed title and generates a safe stable slug; `Versi baru` retains the existing target selector. Keep file validation and processing behavior unchanged. A queued new BPP returns to the document list; persistence/history is backend-owned.

**Verification:** Model/render tests, TypeScript, scoped Ultracite, production build, and desktop/tablet/mobile interaction QA.
