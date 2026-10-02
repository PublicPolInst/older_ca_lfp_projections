import { describe, expect, it } from "vitest";

import { FILTERS } from "../../src/app/filters";

describe("race and ethnicity filter options", () => {
  it("does not offer Pacific Islander as a selectable option", () => {
    const raceFilter = FILTERS.find((filter) => filter.key === "raceEthnicity");

    expect(raceFilter?.values).toEqual(["Latino", "White", "Black", "Asian", "Other/None Listed"]);
  });
});
