import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isPublicFrontendPath } from "@/proxy";

describe("public frontend route policy", () => {
  test("keeps mocked admin routes independent from guest database auth", () => {
    for (const pathname of [
      "/admin",
      "/admin/login",
      "/admin/documents/employee-benefits",
      "/admin/documents/upload",
    ]) {
      assert.equal(isPublicFrontendPath(pathname), true, pathname);
    }

    assert.equal(isPublicFrontendPath("/api/chat"), false);
    assert.equal(isPublicFrontendPath("/login"), false);
  });
});
