import { describe, expect, it } from "vitest";
import { avatarSizeFromPixels, initialsOf, monogramOf } from "./EntityMark.utils";

describe("EntityMark utils", () => {
  it("builds a product monogram and person initials", () => {
    expect(monogramOf("paracetamol")).toBe("P");
    expect(monogramOf("")).toBe("•");
    expect(initialsOf("Asha Devi")).toBe("AD");
    expect(initialsOf("Ravi")).toBe("RA");
  });

  it("maps a pixel size onto the avatar scale", () => {
    expect(avatarSizeFromPixels(28)).toBe("sm");
    expect(avatarSizeFromPixels(34)).toBe("md");
    expect(avatarSizeFromPixels(64)).toBe("lg");
  });
});
