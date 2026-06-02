"use client";

import { createCommunityWithFallback } from "@/lib/community/client";
import type { CommunitySummary } from "@/lib/api/communityApi";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

interface CreateCommunityFormProps {
  onCreated: (community: CommunitySummary) => void;
}

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-nurture-sage/30 px-3 py-2 text-sm focus:border-nurture-sage focus:outline-none focus:ring-1 focus:ring-nurture-sage";

const parseTags = (raw: string): string[] =>
  Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 8);

export function CreateCommunityForm({ onCreated }: CreateCommunityFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] =
    useState<"public" | "private">("public");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setVisibility("public");
    setTags("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      toast.error("Community name must be at least 3 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { community } = await createCommunityWithFallback({
        name: trimmedName,
        description: description.trim(),
        visibility,
        tags: parseTags(tags),
      });
      toast.success(`"${community.name}" created`);
      reset();
      setOpen(false);
      onCreated(community);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create community"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-nurture-sage px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark"
      >
        <span aria-hidden className="text-base leading-none">
          +
        </span>
        Create a community
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-nurture-sage/25 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-nurture-charcoal">
          Create a community
        </h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-sm text-nurture-charcoal/50 hover:text-nurture-charcoal"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="community-name" className="text-sm font-medium text-nurture-charcoal">
            Name
          </label>
          <input
            id="community-name"
            type="text"
            required
            minLength={3}
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Twin Mamas of North Jersey"
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor="community-description"
            className="text-sm font-medium text-nurture-charcoal"
          >
            Description
          </label>
          <textarea
            id="community-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this community about? Who is it for?"
            className={`${inputClassName} resize-none`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="community-visibility"
              className="text-sm font-medium text-nurture-charcoal"
            >
              Visibility
            </label>
            <select
              id="community-visibility"
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "public" | "private")
              }
              className={inputClassName}
            >
              <option value="public">Public — anyone can join</option>
              <option value="private">Private — invite only</option>
            </select>
          </div>

          <div>
            <label htmlFor="community-tags" className="text-sm font-medium text-nurture-charcoal">
              Tags
            </label>
            <input
              id="community-tags"
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="postpartum, local, support"
              className={inputClassName}
            />
            <p className="mt-1 text-xs text-nurture-charcoal/50">
              Separate with commas.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-nurture-sage px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-nurture-sage-dark disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create community"}
        </button>
      </div>
    </form>
  );
}
