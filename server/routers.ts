import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { chessRouter } from "./chess-routers";
import { z } from "zod";
import * as db from "./db";
import { generateSalt, hashPassword, verifyGoogleToken } from "./auth-utils";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(2),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User with this email already exists",
          });
        }

        const salt = generateSalt();
        const hashedPassword = hashPassword(input.password, salt);
        const openId = `email_${crypto.randomUUID()}`;

        await db.upsertUser({
          openId,
          email: input.email,
          name: input.name,
          password: hashedPassword,
          salt,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.password || !user.salt) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const hashedPassword = hashPassword(input.password, user.salt);
        if (hashedPassword !== user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),
    googleLogin: publicProcedure
      .input(z.object({ idToken: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Google Client ID not configured",
          });
        }

        try {
          const googleUser = await verifyGoogleToken(
            input.idToken,
            googleClientId,
          );
          await db.upsertUser({
            openId: googleUser.openId,
            email: googleUser.email,
            name: googleUser.name,
            loginMethod: "google",
            lastSignedIn: new Date(),
          });

          const sessionToken = await sdk.createSessionToken(googleUser.openId, {
            name: googleUser.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, {
            ...cookieOptions,
            maxAge: ONE_YEAR_MS,
          });

          return { success: true };
        } catch (error) {
          console.error("Google login error:", error);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid Google token",
          });
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  chess: chessRouter,
});

export type AppRouter = typeof appRouter;
