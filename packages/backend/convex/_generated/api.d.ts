/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyticsProductivity from "../analyticsProductivity.js";
import type * as analyticsRoutines from "../analyticsRoutines.js";
import type * as analyticsTasks from "../analyticsTasks.js";
import type * as dailyTasks from "../dailyTasks.js";
import type * as days from "../days.js";
import type * as goalLinks from "../goalLinks.js";
import type * as goals from "../goals.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_dayStats from "../lib/dayStats.js";
import type * as lib_resolveUser from "../lib/resolveUser.js";
import type * as lib_routineSetStatus from "../lib/routineSetStatus.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as lib_streak from "../lib/streak.js";
import type * as reflections from "../reflections.js";
import type * as routineManagement from "../routineManagement.js";
import type * as routines from "../routines.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyticsProductivity: typeof analyticsProductivity;
  analyticsRoutines: typeof analyticsRoutines;
  analyticsTasks: typeof analyticsTasks;
  dailyTasks: typeof dailyTasks;
  days: typeof days;
  goalLinks: typeof goalLinks;
  goals: typeof goals;
  "lib/auth": typeof lib_auth;
  "lib/dayStats": typeof lib_dayStats;
  "lib/resolveUser": typeof lib_resolveUser;
  "lib/routineSetStatus": typeof lib_routineSetStatus;
  "lib/schedule": typeof lib_schedule;
  "lib/streak": typeof lib_streak;
  reflections: typeof reflections;
  routineManagement: typeof routineManagement;
  routines: typeof routines;
  users: typeof users;
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
