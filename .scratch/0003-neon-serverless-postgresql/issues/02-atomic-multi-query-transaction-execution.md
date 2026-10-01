# 02: Atomic Multi-Query Transaction Execution & Rollback Slice

**What to build:** An atomic transaction execution wrapper that runs multi-statement database operations inside an ACID transaction block over the Neon serverless HTTP interface. If any operation within the transaction fails or throws an exception, all preceding mutations within that block are automatically rolled back, guaranteeing database consistency for critical multi-table workflows (such as order checkout and payment fulfillment).

**Blocked by:** 01: Parameterized Direct SQL Client & PostgreSQL Error Mapping Slice

**Status:** completed

- [x] A transaction runner utility (`transaction<T>((tx) => Promise<T>)`) executes multi-statement workflows within an atomic transaction.
- [x] Invocations where all inner database statements succeed commit all mutations permanently.
- [x] If an error or constraint violation occurs during any step of the transaction block, all preceding modifications are rolled back.
- [x] Rollback behavior leaves no partial or orphaned rows in any participating tables.
- [x] The transaction boundary accurately passes the committed return value or rethrows the classified domain error to the caller.

