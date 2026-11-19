/**
 * Company reference data transcribed from the public CBCisstant app
 * (Jrairigh1/CBCisstant index.html). These are state and insurer rules
 * for CBC deals, not client files. Blank company-form addresses are the
 * same SharePoint template links CBCisstant already publishes. Progrum
 * never fetches them.
 */

export interface StateRule {
  rateCap: string;
  requiresAffDec: "No" | "Aff" | "Dec";
  noPoachState: "Yes" | "No";
  additionalNotes: string;
  legalCounsel: string;
  expectedLegalFee: string;
  holdTime: string;
}

/**
 * States that require independent professional advice.
 * Edit this list to add or remove a state. It is the only place that
 * decision is stored. Taken from CBCisstant index.html, stateData, where
 * requiresIPA is "Yes": Alaska, Delaware, Louisiana, Maine, Maryland,
 * and North Carolina.
 */
export const IPA_REQUIRED_STATES = ["AK", "DE", "LA", "ME", "MD", "NC"] as const;

export function ipaRequired(stateCode: string): boolean {
  return (IPA_REQUIRED_STATES as readonly string[]).includes(stateCode);
}

export interface InsurerRule {
  name: string;
  notes: string;
  conferenceCalls: "Yes" | "No";
  paymentConfirmation: string;
  creditRating: string;
  adminFee: string;
  requestProcedure: string;
}

export const STATES: Record<string, StateRule> = {
  "AL": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Brooke Davis",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "AK": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Jess Webster",
    "expectedLegalFee": "$3500",
    "holdTime": "10"
  },
  "AZ": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Dec",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Amy Schwartz",
    "expectedLegalFee": "$2600",
    "holdTime": "3"
  },
  "AR": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Whit Light",
    "expectedLegalFee": "$2200",
    "holdTime": "3"
  },
  "CA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Dec",
    "noPoachState": "No",
    "additionalNotes": "California has specific county rules. Orange County judges prefer effective rates below 20%, but deals have been done at 25% in the last 3-4 years, so it's not a hard rule. Fresno County is the hardest in the state; judges scrutinize all facts closely, including any priors, and may push for a lower rate to give the client more money (often requires IPA after approving the sale, which can be difficult).",
    "legalCounsel": "James Felton",
    "expectedLegalFee": "$4000",
    "holdTime": "10"
  },
  "CO": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Chad McShane",
    "expectedLegalFee": "$2750",
    "holdTime": "3"
  },
  "CT": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Doug Evans",
    "expectedLegalFee": "$3000",
    "holdTime": "3"
  },
  "DE": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Rob Gibbs",
    "expectedLegalFee": "$3500",
    "holdTime": "10"
  },
  "DC": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "McMillan Metro (Elyse & Jose)",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "FL": {
    "rateCap": "None but possible stay under 24.99%",
    "requiresAffDec": "Aff",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Ken Dion",
    "expectedLegalFee": "$2200",
    "holdTime": "10"
  },
  "GA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "Yes",
    "additionalNotes": "",
    "legalCounsel": "Shannon Carpenter",
    "expectedLegalFee": "$2600",
    "holdTime": "3"
  },
  "HI": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "TBD",
    "expectedLegalFee": "$5000",
    "holdTime": "1"
  },
  "ID": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Paul Okner",
    "expectedLegalFee": "$2800",
    "holdTime": "3"
  },
  "IL": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "Cook County has specific rules. Cook County (Chicago) has an unwritten rule that effective rates need to be at 15.00% or below.",
    "legalCounsel": "Mack & Tragos",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "IN": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Mack & Tragos",
    "expectedLegalFee": "$2500",
    "holdTime": "10"
  },
  "IA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Mack & Tragos",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "KS": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Amber Steinbeck",
    "expectedLegalFee": "$2300",
    "holdTime": "3"
  },
  "KY": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Kevin Mack",
    "expectedLegalFee": "$2700",
    "holdTime": "N/A"
  },
  "LA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "Yes",
    "additionalNotes": "",
    "legalCounsel": "John Toerner",
    "expectedLegalFee": "$3000",
    "holdTime": "10"
  },
  "ME": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Gray & Palmer",
    "expectedLegalFee": "$2200",
    "holdTime": "10"
  },
  "MD": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "McMillan Metro (Elyse & Jose)",
    "expectedLegalFee": "$2500",
    "holdTime": "10"
  },
  "MA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Doug Evans",
    "expectedLegalFee": "$3000",
    "holdTime": "10"
  },
  "MI": {
    "rateCap": "25%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Mack & Tragos",
    "expectedLegalFee": "$2500",
    "holdTime": "N/A"
  },
  "MN": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Aff",
    "noPoachState": "Yes",
    "additionalNotes": "",
    "legalCounsel": "Katrina Turman",
    "expectedLegalFee": "$2750",
    "holdTime": "10"
  },
  "MS": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Eric Dillon",
    "expectedLegalFee": "$2100",
    "holdTime": "3"
  },
  "MO": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Amber Steinbeck",
    "expectedLegalFee": "$2300",
    "holdTime": "10"
  },
  "MT": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Christopher Betchie",
    "expectedLegalFee": "$3000",
    "holdTime": "3"
  },
  "NE": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "Lincoln County used to have judges who wanted all deals below 15.00%, but those judges are mostly retired, so deals can now be done at 29.99% if desired.",
    "legalCounsel": "Marc Odgaard",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "NV": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Aff",
    "noPoachState": "Yes",
    "additionalNotes": "",
    "legalCounsel": "Hector Carabajal",
    "expectedLegalFee": "$2800",
    "holdTime": "3"
  },
  "NH": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Doug Evans",
    "expectedLegalFee": "$3000",
    "holdTime": "10"
  },
  "NJ": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "New Jersey has varying county rules. Counties like Atlantic, Cumberland, Bergen, Middlesex, and Ocean have judges who may require rates at or below 15.00%, depending on the judge assigned.",
    "legalCounsel": "Dugalic & Landau",
    "expectedLegalFee": "$2800",
    "holdTime": "3"
  },
  "NM": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Juan Marquez",
    "expectedLegalFee": "$2800",
    "holdTime": "3"
  },
  "NY": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Aff",
    "noPoachState": "No",
    "additionalNotes": "New York has specific county rules. Judges vary by county on their opinion of these deals. In the 5 boroughs of NYC, deals are heavily scrutinized. Manhattan (New York County) needs to be priced in the high single digits/low double digits. Brooklyn (Kings County), Bronx (Bronx County), Queens (Queens County), and Staten Island (Richmond County) all differ; it's best to ask UW before pricing a New York file.",
    "legalCounsel": "Sacco & Fillas (Luigi)",
    "expectedLegalFee": "$3500",
    "holdTime": "10"
  },
  "NC": {
    "rateCap": "12.5% (5% above current prime rate, changes monthly)",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "RL Adams",
    "expectedLegalFee": "$2850",
    "holdTime": "N/A"
  },
  "ND": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Katrina Turman",
    "expectedLegalFee": "$2750",
    "holdTime": "3"
  },
  "OH": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "Cuyahoga County has specific rules. Cuyahoga County (Cleveland) has an unwritten rule that the disclosure quotient must exceed 50.00% for court approval, but many deals have been completed below this threshold depending on cash flow, term of payments, purchase price, and the client's reasons for transfer.",
    "legalCounsel": "Steve Mastrantonio",
    "expectedLegalFee": "$2600",
    "holdTime": "10"
  },
  "OK": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Henry Dow (Kathy Keener)",
    "expectedLegalFee": "$1500",
    "holdTime": "3"
  },
  "OR": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Dec",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Paul Okner",
    "expectedLegalFee": "$2800",
    "holdTime": "14"
  },
  "PA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Dec",
    "noPoachState": "No",
    "additionalNotes": "Pennsylvania has specific county rules. Allegheny County (Pittsburgh) has a rotation of 5 judges who try to get rates down to 15.00% or lower and will scrutinize the client's situation very closely.",
    "legalCounsel": "Dugalic & Landau / Margolis Edelstein (Ron Reitz)",
    "expectedLegalFee": "$2800 - $3000",
    "holdTime": "10"
  },
  "RI": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Doug Evans",
    "expectedLegalFee": "$3000",
    "holdTime": "10"
  },
  "SC": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "Yes",
    "additionalNotes": "",
    "legalCounsel": "Richard (Rick) Steadman",
    "expectedLegalFee": "$2300",
    "holdTime": "3"
  },
  "SD": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Glenn L. Roth (JGW counsel)",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "TN": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Aff",
    "noPoachState": "No",
    "additionalNotes": "Shelby County has specific rules. Shelby County (Memphis) has a judge whose initial reaction to applications is to deny the petition; there are no unwritten rules, and the judge reviews each case individually to determine what the client must show for approval (Shelby has 3 or 4 judges, so the odds of drawing this strict judge are 1 in 3 or 1 in 4).",
    "legalCounsel": "Kevin Mack",
    "expectedLegalFee": "$3000",
    "holdTime": "10"
  },
  "TX": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "Harris County has specific rules. Harris County (Houston) has a few judges who prefer deals not to exceed 25%, but it depends on the judge assigned after filing; Texas counsel will provide a heads-up on the judge assignment, which is passed on to the rep and Mike immediately.",
    "legalCounsel": "Brian Dear",
    "expectedLegalFee": "$3000",
    "holdTime": "3"
  },
  "UT": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Fabian VanCott (Clint Hansen is counsel)",
    "expectedLegalFee": "$2850",
    "holdTime": "3"
  },
  "VT": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "TBD",
    "expectedLegalFee": "$3000",
    "holdTime": "10"
  },
  "VA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "McMillan Metro (Elyse & Jose)",
    "expectedLegalFee": "$2500",
    "holdTime": "3"
  },
  "WA": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Paul Okner",
    "expectedLegalFee": "$2800",
    "holdTime": "3"
  },
  "WV": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Kay Casto",
    "expectedLegalFee": "$3000",
    "holdTime": "N/A"
  },
  "WI": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "Aff",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "Mack & Tragos",
    "expectedLegalFee": "$2500",
    "holdTime": "N/A"
  },
  "WY": {
    "rateCap": "None but if possible stay under 24.99%",
    "requiresAffDec": "No",
    "noPoachState": "No",
    "additionalNotes": "",
    "legalCounsel": "TBD",
    "expectedLegalFee": "$3000",
    "holdTime": "3"
  }
};

export const STATE_NAMES: Record<string, string> = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "DC": "Washington, D.C.",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
};

export const INSURERS: Record<string, InsurerRule> = {
  "AL": {
    "name": "Allstate Life Insurance Company",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,000.00",
    "requestProcedure": "requires notary"
  },
  "AF": {
    "name": "American Family Mutual Insurance Co.",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$750.00",
    "requestProcedure": "TBD"
  },
  "AG": {
    "name": "American General",
    "notes": "Requires additional verification. We have contacts at the law firm representing this carrier, who are helpful with verifying payment streams ('clearing pays'). Send a signed authorization to release information and benefits request form (can be completed via DocuSign), including at least the policy number and DOB (clients may be reluctant to provide SS#).",
    "conferenceCalls": "No",
    "paymentConfirmation": "Call 1-800-555-1234",
    "creditRating": "A-",
    "adminFee": "$1,250.00",
    "requestProcedure": "original signature"
  },
  "AM": {
    "name": "Amica Life Insurance Company",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,000.00",
    "requestProcedure": "TBD"
  },
  "AU": {
    "name": "Aurora National Life Insurance Co.",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$850.00",
    "requestProcedure": "TBD"
  },
  "AX": {
    "name": "AXA Equitable",
    "notes": "Standard processing. To verify pays, the process is identical to United of Omaha: signatures on request forms must be ink-signed.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$750.00",
    "requestProcedure": "accepts docusign"
  },
  "AT": {
    "name": "Athene",
    "notes": "Requires notarized documents.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Email to claims@athene.com",
    "creditRating": "A",
    "adminFee": "$1,000.00",
    "requestProcedure": "original signature"
  },
  "BK": {
    "name": "Berkshire",
    "notes": "Quick processing. For Berkshire Hathaway Life Insurance Company of Nebraska/National Indemnity Company (common Berkshire payors), the process is almost identical to Hartford/Talcott: requires notarized request forms; upon receipt, they will process and send the requested docs with an updated benefits letter within a day at most.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Call 1-800-555-5678",
    "creditRating": "AA+",
    "adminFee": "No Fee",
    "requestProcedure": "requires notary"
  },
  "BH": {
    "name": "Brighthouse",
    "notes": "Delays possible.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Online portal",
    "creditRating": "A-",
    "adminFee": "$1,250.00",
    "requestProcedure": "accepts docusign"
  },
  "CL": {
    "name": "Canada Life Assurance Company",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$250.00",
    "requestProcedure": "requires notary"
  },
  "CG": {
    "name": "Connecticut General Life Co.",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$750.00",
    "requestProcedure": "TBD"
  },
  "CN": {
    "name": "Continental Life Insurance Company",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,200.00",
    "requestProcedure": "TBD"
  },
  "FM": {
    "name": "Farmers",
    "notes": "Policyholder must initiate. For Farmers New World Life Insurance Company, we have contacts at the law firm representing this carrier, who are helpful with verifying payment streams ('clearing pays'). Send a signed authorization to release information and benefits request form (can be completed via DocuSign), including at least the policy number and DOB (clients may be reluctant to provide SS#).",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Call 1-800-555-9012",
    "creditRating": "A",
    "adminFee": "$750.00",
    "requestProcedure": "requires notary"
  },
  "FG": {
    "name": "Fidelity and Guaranty Life Insurance Co.",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$900.00",
    "requestProcedure": "TBD"
  },
  "FA": {
    "name": "Fiduciary Association Benefits Co. (GABC)",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,500.00",
    "requestProcedure": "original signature"
  },
  "GW": {
    "name": "Genworth",
    "notes": "Extended review for large settlements.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Fax to 1-888-555-3456",
    "creditRating": "BBB+",
    "adminFee": "$750.00",
    "requestProcedure": "original signature"
  },
  "HT": {
    "name": "Hartford/Talcott",
    "notes": "Requires court approval. Requires notarized request forms; upon receipt, Hartford/Talcott will process and send the requested annuity & settlement docs, with an updated benefits letter, within a day at most.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Mail to Hartford office",
    "creditRating": "A",
    "adminFee": "$1,500.00",
    "requestProcedure": "requires notary"
  },
  "IL": {
    "name": "Independent Life Insurance Company",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,200.00",
    "requestProcedure": "TBD"
  },
  "IN": {
    "name": "Insurance Company of North America",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,000.00",
    "requestProcedure": "TBD"
  },
  "JH": {
    "name": "John Hancock",
    "notes": "Fast track for small claims. The process is similar to Prudential: the benefits request letter must contain the policy number, DOB, and SS#. These can be completed via DocuSign, and UW will email or fax them to request the annuity & settlement docs. Turnaround time for an updated benefits letter varies between 1 day to 5-7 days, case by case.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Online portal",
    "creditRating": "AA",
    "adminFee": "$1,000.00 for first deal, $1,350.00 for all subsequent deals",
    "requestProcedure": "accepts docusign"
  },
  "LB": {
    "name": "Liberty",
    "notes": "Policy review takes 3-5 days.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Email confirmation",
    "creditRating": "A-",
    "adminFee": "$850.00",
    "requestProcedure": "requires notary"
  },
  "LN": {
    "name": "Lincoln National",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$850.00",
    "requestProcedure": "TBD"
  },
  "MM": {
    "name": "Mass Mutual",
    "notes": "Requires detailed payment history.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Call 1-800-555-7890",
    "creditRating": "AA+",
    "adminFee": "$750.00",
    "requestProcedure": "original signature"
  },
  "ML": {
    "name": "MetLife",
    "notes": "Processing may take extra time.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Online portal or email",
    "creditRating": "AA-",
    "adminFee": "$1,250.00",
    "requestProcedure": "requires notary"
  },
  "NY": {
    "name": "NY Life",
    "notes": "Strict documentation standards.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Online portal",
    "creditRating": "AA+",
    "adminFee": "$1,000.00",
    "requestProcedure": "original signature"
  },
  "PL": {
    "name": "Pacific Life",
    "notes": "Needs signed consent form.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Fax to 1-888-555-5678",
    "creditRating": "A+",
    "adminFee": "$950.00",
    "requestProcedure": "original signature"
  },
  "PR": {
    "name": "Prudential",
    "notes": "May require additional signatures. The benefits request letter must contain the policy number, DOB, and SS#. These can be completed via DocuSign, and UW will email or fax them to Prudential to request the annuity & settlement docs. Prudential takes 48-72 hours at most to fulfill the requests and send the docs back.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Fax to 1-888-555-9012",
    "creditRating": "AA-",
    "adminFee": "$750.00 or $865.00",
    "requestProcedure": "accepts docusign"
  },
  "SN": {
    "name": "Sentry Life Insurance Company",
    "notes": "Standard processing.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$750.00",
    "requestProcedure": "TBD"
  },
  "SF": {
    "name": "State Farm",
    "notes": "Simple process for standard claims.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Call 1-800-555-3456",
    "creditRating": "AA",
    "adminFee": "$750.00",
    "requestProcedure": "requires notary"
  },
  "SY": {
    "name": "Symetra",
    "notes": "Requires policyholder affidavit.",
    "conferenceCalls": "Yes",
    "paymentConfirmation": "Email to support@symetra.com",
    "creditRating": "A",
    "adminFee": "Guaranteed - $1,500.00, Life Contingent - $3,210.00",
    "requestProcedure": "requires notary"
  },
  "USNY": {
    "name": "The United States Life Insurance Co. of NY",
    "notes": "Standard processing. Also known as 'AIG-NY'. We have contacts at the law firm representing this carrier, who are helpful with verifying payment streams ('clearing pays'). Send a signed authorization to release information and benefits request form (can be completed via DocuSign), including at least the policy number and DOB (clients may be reluctant to provide SS#).",
    "conferenceCalls": "No",
    "paymentConfirmation": "Contact customer service",
    "creditRating": "A",
    "adminFee": "$1,250.00",
    "requestProcedure": "TBD"
  },
  "TA": {
    "name": "Transamerica",
    "notes": "Submit policy copy with application.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Mail to PO Box 1234",
    "creditRating": "A",
    "adminFee": "$1,100.00",
    "requestProcedure": "original signature"
  },
  "UO": {
    "name": "United of Omaha",
    "notes": "Processing time varies. United of Omaha will verify pays (we have their legal and customer service department contacts), but signatures on the request forms must be ink-signed.",
    "conferenceCalls": "No",
    "paymentConfirmation": "Mail to Omaha office",
    "creditRating": "A+",
    "adminFee": "$750.00",
    "requestProcedure": "TBD"
  },
  "US": {
    "name": "USAA",
    "notes": "Military verification may be needed. We have contacts at the law firm representing this carrier, who are helpful with verifying payment streams ('clearing pays'). Send a signed authorization to release information and benefits request form (can be completed via DocuSign), including at least the policy number and DOB (clients may be reluctant to provide SS#).",
    "conferenceCalls": "No",
    "paymentConfirmation": "Online portal",
    "creditRating": "AA+",
    "adminFee": "TBD",
    "requestProcedure": "TBD"
  }
};


export interface StateForm {
  name: string;
  url: string;
}

/**
 * Blank state templates published in CBCisstant. These are company forms to
 * send or fill, not the client's own documents. Progrum never fetches them.
 */
export const STATE_FORMS: Record<string, StateForm[]> = {
  AZ: [{ name: "Declaration", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EX5OVAz2g_NPtbpMvNvXwLAB-lQhm6cehevqh_qVJf4QVQ?e=mdiqwl" }],
  CA: [{ name: "Declaration", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EaVi9NxoxbxGrFzsQ2iYDeUBqeoy3ZW79PI5nME-nc0t6w?e=70DlAS" }],
  FL: [{ name: "Affidavit", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/Eb68Bv5LIMhEmpjIQJEfTNYB11T9irngJDUaY_Ao11q5Zw?e=579H42" }],
  MN: [{ name: "Affidavit", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EfP6Jno_WmRJgr_-jPGM6ywBJkUUqc03GTyJek4VILGYlQ?e=NPiDjb" }],
  NV: [{ name: "Affidavit", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/Eftca_XX8LZAvW2P1glqmBMBrMyeCnV0Emzyf1tk0Qrhhw?e=cSwHg3" }],
  NY: [{ name: "Affidavit", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/Ea4FziALeI1KuQEPA96myCkBl_ovUNEwN1Cwa1f34gzIOA?e=3BvMe3" }],
  OR: [{ name: "Declaration", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EeCNMEvG7G1JphaVQgWCNCoBZJTVU-yE-hXr3_lHDK90mw?e=gGDiY3" }],
  PA: [{ name: "Declaration", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/ESlaxbDJHqVGlRouXaf-TWcBWXxfO2jkULE4BDJNlY7cEg?e=S8fuuG" }],
  TN: [{ name: "Affidavit", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/ER9UnFgLtgdGlRdCiNWyrFoB47yMWgysFkFH8kUlojNTDQ?e=1ILhFM" }],
  WI: [{ name: "Affidavit", url: "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EVcnVEL7CAVInZTMZfgAt34BfsoYSzs3qht6FF5fUi7MYw?e=fjTTcV" }],
};

/** First blank affidavit or declaration form for a state, used by extra pieces. */
export const AFFIDAVIT_FORMS: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_FORMS).flatMap(([code, forms]) => (forms[0] ? [[code, forms[0].url]] : [])),
);

export function stateFormsFor(code: string): StateForm[] {
  return STATE_FORMS[code] ?? [];
}

/** Extra link-only pieces for a state. Add another state here when it needs one. */
export const STATE_EXTRA_PIECES: Record<string, { id: string; label: string; short: string; hint: string }[]> = {
  CA: [
    {
      id: "docusign-cert-declaration",
      label: "DocuSign Cert for Declaration",
      short: "DocuSign Cert for Declaration",
      hint: "DocuSign certificate of completion for the declaration.",
    },
  ],
};


/** Blank authorization-to-release form. */
export const AUTHORIZATION_FORM = "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EcfbEWrE5uFNk7rQ_vbiyuEBPB2Tx14mp6nGhSZMUMKgjw?e=dZl12V";

/** Blank Fasano template from the CBCisstant sidebar. Not fetched. */
export const FASANO_FORM = "https://cbcsettlementfundings-my.sharepoint.com/:b:/g/personal/jrairigh_cbcsettlementfunding_com/EceYDgEAuFFAsfhP8Bon9hABgCG3KMfmjaqWk-kXsgCiBQ?e=aKI9sk";

/** Blank advance letter on the shared drive. Not fetched. */
export const ADVANCE_FORM = "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EW5Qiva7E21JkbyIQax_C0MBIIiZNey8mg1l_u4FjxFvdQ?e=UOaht5";

/** Blank best-interest declaration from the CBCisstant sidebar. Not fetched. */
export const BEST_INTEREST_FORM = "https://cbcsettlementfundings-my.sharepoint.com/:w:/g/personal/jrairigh_cbcsettlementfunding_com/EZGgcilwEdBHmnBywjSFM3ABdyIxBmjDIfvvk33fdfgP_A?e=0AkBOR";

/** Shared-drive templates from the CBCisstant Quick Links list. */
export const QUICK_LINKS = [
  { label: "Advance Document", url: ADVANCE_FORM },
  { label: "Fasano Document", url: FASANO_FORM },
  { label: "Authorization to Release Information", url: AUTHORIZATION_FORM },
  { label: "Best Interest Declaration", url: BEST_INTEREST_FORM },
] as const;

/**
 * Wire origination fee in dollars. Null means the advance form leaves the
 * fee blank so it can be typed. A number prefills the fee and stays editable.
 */
export const WIRE_FEE: number | null = null;

/**
 * Extra documents for an LA abuse file. These are link-only pieces, like
 * every other document on a board. Edit the names here.
 */
export const LA_ABUSE_PIECES = [
  {
    id: "point-allocation",
    label: "Point Allocation",
    short: "Point Allocation",
    hint: "Point allocation for an LA abuse file.",
  },
  {
    id: "first-payment-breakdown",
    label: "First Payment Breakdown",
    short: "First Payment Breakdown",
    hint: "First payment breakdown for an LA abuse file.",
  },
] as const;

export const LA_ABUSE_PIECE_IDS = LA_ABUSE_PIECES.map((piece) => piece.id);

/** Berkshire may appear at the hearing in these states. */
export const BIFCO_STATES = ["CA","AZ","FL","MS","TX","IN","IL","PA","NY"];

/** States underwritten by Anthony Lazzaro. Every other state is Mike Dalby. */
export const LAZZARO_STATES = ["AL","AK","AZ","AR","CT","GA","HI","IA","ID","IL","IN","LA","MA","MI","MT","NY","NH","OH","OR","RI","SC","TN","VT","WA","WV","DC"];

/** MetLife allows payment splits only in these states. */
export const METLIFE_SPLIT_STATES = ["AK","AZ","IN","MA","NH","SC","WV","MO","DE","FL","KY","ME","MN","NE","NC","PA"];

export const IPA_FEE = 1500;

export function stateName(code: string): string {
  return STATE_NAMES[code] ?? code;
}

export function insurerName(code: string): string {
  return INSURERS[code]?.name ?? code;
}

/** Label used in client lists. LA abuse files have no insurance company. */
export function clientInsurerLabel(client: { insurer: string; laAbuse?: boolean }): string {
  if (client.laAbuse) return "LA abuse";
  if (!client.insurer) return "No insurer";
  return insurerName(client.insurer);
}

export function underwriterFor(stateCode: string): string {
  if (!stateCode) return "";
  return LAZZARO_STATES.includes(stateCode) ? "Anthony Lazzaro" : "Mike Dalby";
}

export function stateOptions(): { code: string; name: string }[] {
  return Object.entries(STATE_NAMES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function insurerOptions(): { code: string; name: string }[] {
  return Object.entries(INSURERS)
    .map(([code, rule]) => ({ code, name: rule.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
