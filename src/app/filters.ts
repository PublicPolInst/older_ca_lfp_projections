export interface FilterDefinition {
  key: "raceEthnicity" | "gender" | "ageCategory" | "education";
  label: string;
  /** Text for the unfiltered option; defaults to "All". */
  allLabel?: string;
  values: readonly string[];
}

export const FILTERS: readonly FilterDefinition[] = [
  {
    key: "raceEthnicity",
    label: "Race/Ethnicity",
    // Pacific Islander is deliberately not selectable (as in v0's dropdown):
    // rows with `pacis=TRUE` keep their own category, so they count toward
    // every "All" aggregate but belong to none of the options listed here.
    values: ["Latino", "White", "Black", "Asian", "Other/None Listed"],
  },
  { key: "gender", label: "Gender", values: ["Female", "Male"] },
  {
    key: "ageCategory",
    label: "Age Group",
    // The dataset only covers ages 55 and up, so say what "All" spans.
    allLabel: "All (55 and older)",
    values: ["55-64", "65 and older", "55-59", "60-64", "65-69", "70-74", "75-79", "80-84", "85-89", "90+"],
  },
  {
    key: "education",
    label: "Education",
    values: ["No HS Degree", "HS Graduate", "Some College", "College Graduate"],
  },
];
