/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as importData from "../importData.js";
import type * as jobs from "../jobs.js";
import type * as lib_acceptedJobSources from "../lib/acceptedJobSources.js";
import type * as lib_matchScore from "../lib/matchScore.js";
import type * as lib_remoteFilter from "../lib/remoteFilter.js";
import type * as lib_scoreImportedJobCandidate from "../lib/scoreImportedJobCandidate.js";
import type * as lib_scrapers from "../lib/scrapers.js";
import type * as lib_types from "../lib/types.js";
import type * as profiles from "../profiles.js";
import type * as trackedJobs from "../trackedJobs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  importData: typeof importData;
  jobs: typeof jobs;
  "lib/acceptedJobSources": typeof lib_acceptedJobSources;
  "lib/matchScore": typeof lib_matchScore;
  "lib/remoteFilter": typeof lib_remoteFilter;
  "lib/scoreImportedJobCandidate": typeof lib_scoreImportedJobCandidate;
  "lib/scrapers": typeof lib_scrapers;
  "lib/types": typeof lib_types;
  profiles: typeof profiles;
  trackedJobs: typeof trackedJobs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
