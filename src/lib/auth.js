
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { client, db } from "./mongodb.js";

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "farmer",
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      businessName: {
        type: "string",
        required: false,
        input: true,
      },
      businessCategory: {
        type: "string",
        required: false,
        input: true,
      },
      gstin: {
        type: "string",
        required: false,
        input: true,
      },
      preferredLanguage: {
        type: "string",
        required: false,
        defaultValue: "en",
        input: true,
      },
      isSuspended: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
