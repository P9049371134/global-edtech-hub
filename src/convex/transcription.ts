import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Schema-side types (kept minimal here)
// chunks: { ts: number; text: string; translated?: string }

// Public: return null so UI falls back to client-side transcript
export const getLiveForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // Intentionally return null; server transcript is optional
    return null;
  },
});

// Public: no-op start; exists to satisfy UI calls when enabled by teachers/admins in the future
export const start = mutation({
  args: {
    sessionId: v.id("sessions"),
    sourceLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

// Public: no-op append; guarded on client to only call if live transcript exists (it won't)
export const appendChunk = mutation({
  // Use an existing table id type; will never be called since getLiveForSession returns null
  args: { transcriptId: v.id("sessions"), text: v.string() },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

// Public: no-op stop
export const stop = mutation({
  args: { transcriptId: v.id("sessions") },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

// Public: no-op set target language
export const setTargetLanguage = mutation({
  args: { transcriptId: v.id("sessions"), targetLanguage: v.string() },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

export const getById = query({
  // Accept a string id to avoid referencing a missing table type
  args: { transcriptId: v.string() },
  handler: async (ctx, args) => {
    // No server transcript storage yet
    return null;
  },
});

export const listForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // No server transcript storage yet
    return [];
  },
});