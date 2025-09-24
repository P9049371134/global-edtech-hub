/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as aiInternal from "../aiInternal.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as classrooms from "../classrooms.js";
import type * as demo from "../demo.js";
import type * as googleHttpActions from "../googleHttpActions.js";
import type * as googleInternal from "../googleInternal.js";
import type * as http from "../http.js";
import type * as meetings from "../meetings.js";
import type * as messages from "../messages.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as notificationsInternal from "../notificationsInternal.js";
import type * as presence from "../presence.js";
import type * as reports from "../reports.js";
import type * as sessions from "../sessions.js";
import type * as system from "../system.js";
import type * as testData from "../testData.js";
import type * as users from "../users.js";
import type * as videos from "../videos.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiInternal: typeof aiInternal;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  classrooms: typeof classrooms;
  demo: typeof demo;
  googleHttpActions: typeof googleHttpActions;
  googleInternal: typeof googleInternal;
  http: typeof http;
  meetings: typeof meetings;
  messages: typeof messages;
  notes: typeof notes;
  notifications: typeof notifications;
  notificationsInternal: typeof notificationsInternal;
  presence: typeof presence;
  reports: typeof reports;
  sessions: typeof sessions;
  system: typeof system;
  testData: typeof testData;
  users: typeof users;
  videos: typeof videos;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
