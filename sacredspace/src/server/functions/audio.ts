import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { contents } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/tanstack-react-start/server";
import { validateAudioUpload, generateUploadName } from "~/lib/upload";
import { storeFile, deleteStoredFile } from "~/lib/storage";
import { UnauthorizedError } from "~/lib/errors";
import { audioUpload, slugParam } from "./validators";

export const uploadContentAudio = createServerFn({ method: "POST" })
  .validator(audioUpload)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();

    const { buffer, ext, mime } = validateAudioUpload(data.audioBase64);
    const name = generateUploadName("audio", ext);
    const { url } = await storeFile(name, buffer, mime);

    // Clean up the previous audio file (Blob only — local files are kept).
    const previous = await db.select({ audioUrl: contents.audioUrl }).from(contents).where(eq(contents.slug, data.contentSlug)).get();
    await deleteStoredFile(previous?.audioUrl);

    await db.update(contents).set({ audioUrl: url }).where(eq(contents.slug, data.contentSlug)).run();
    return { audioUrl: url };
  });

export const removeContentAudio = createServerFn({ method: "POST" })
  .validator(slugParam)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) throw new UnauthorizedError();

    // Delete the uploaded audio file (if any) before clearing the reference.
    const existing = await db.select({ audioUrl: contents.audioUrl }).from(contents).where(eq(contents.slug, data)).get();
    await deleteStoredFile(existing?.audioUrl);

    await db.update(contents).set({ audioUrl: null }).where(eq(contents.slug, data)).run();
    return { ok: true };
  });