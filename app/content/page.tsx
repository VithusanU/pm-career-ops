"use client";
import { useState } from "react";
import rawContent from "@/data/content.json";
import clsx from "clsx";

const statusColors: Record<string, string> = {
  Idea:      "bg-slate-100 text-slate-600",
  Draft:     "bg-yellow-100 text-yellow-700",
  Published: "bg-green-100 text-green-700",
};

const ARTICLE_TEMPLATES = [
  {
    type: "Onboarding Teardown",
    structure: `# Breaking Down [Company]'s User Onboarding

**Hook:** One surprising thing about how [Company] onboards users.

## The First 5 Minutes
- What they show you immediately
- What decision they're forcing you to make
- What emotion they're trying to trigger

## The Activation Moment
- When does the "aha!" happen?
- How do they guide you there?
- What % of users probably reach this?

## 3 Things I'd Improve
1. [Improvement + why it matters to the business]
2. [Improvement + why it matters to the business]
3. [Improvement + why it matters to the business]

## What This Tells Us About Their PM Priorities
[1 paragraph connecting the product decisions to business strategy]

**CTA:** What do you think? Drop a comment or DM me.`,
  },
  {
    type: "Feature Pitch",
    structure: `# 3 Features I'd Build for [Company]

**Hook:** [Company] is great at X, but here's what's missing.

## Context: What They're Optimizing For
[Brief on their current product strategy and what metrics matter]

## Feature 1: [Name]
- **Problem:** [User pain point]
- **Solution:** [What you'd build]
- **Success metric:** [How you'd measure it]
- **Why now:** [Why this is the right priority]

## Feature 2: [Name]
[Same structure]

## Feature 3: [Name]
[Same structure]

## The PM Thinking Behind This
[Paragraph on how you'd prioritize these against each other]

**CTA:** I'd love to hear from PMs at [Company] — am I missing something?`,
  },
  {
    type: "PM Lesson / Reflection",
    structure: `# [X PM Lessons] From [Project/Experience]

**Hook:** [Counterintuitive or surprising statement]

## Background
[Brief context on the project or experience — 2–3 sentences]

## Lesson 1: [Principle]
[Story → insight → how it applies generally]

## Lesson 2: [Principle]
[Story → insight → how it applies generally]

## Lesson 3: [Principle]
[Story → insight → how it applies generally]

## The Bigger Picture
[1 paragraph connecting these lessons to how you think about PM work]

**CTA:** What's the best PM lesson you've learned the hard way?`,
  },
  {
    type: "Tool / AI Analysis",
    structure: `# How I'd Use AI to Improve [Company]'s Product

**Hook:** [Company] isn't using AI where it matters most — here's what I'd change.

## What the Product Does Today
[Core loop, key user actions, current AI features if any]

## 3 High-Leverage AI Integrations

### 1. [Feature Name]
- **Where it fits:** [Part of the product]
- **User benefit:** [Specific outcome]
- **Business impact:** [Retention / growth / cost reduction]

### 2. [Feature Name]
[Same]

### 3. [Feature Name]
[Same]

## How I'd Prioritize These
[Brief prioritization framework: impact × effort × strategic fit]

**CTA:** Are you a PM thinking about AI integration? Let's talk.`,
  },
];

export default function Content() {
  const [posts] = useState(rawContent);
  const [activeTemplate, setActiveTemplate] = useState(0);

  const ideas = posts.filter((p) => p.status === "Idea").length;
  const drafts = posts.filter((p) => p.status === "Draft").length;
  const published = posts.filter((p) => p.status === "Published").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Engine</h1>
        <p className="text-slate-500 text-sm mt-1">
          Turn every company analysis into a portfolio piece. 2 posts/week minimum.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Ideas", value: ideas, color: "text-slate-600" },
          { label: "In Draft", value: drafts, color: "text-yellow-600" },
          { label: "Published", value: published, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content list */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Content Tracker</h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
              <span className={clsx("badge mt-0.5 shrink-0", statusColors[post.status])}>{post.status}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{post.title}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="badge bg-slate-100 text-slate-500">{post.type}</span>
                  {post.platform.map((p) => (
                    <span key={p} className="badge bg-blue-50 text-blue-600">{p}</span>
                  ))}
                  {post.targetCompany && (
                    <span className="badge bg-purple-50 text-purple-600">→ {post.targetCompany}</span>
                  )}
                </div>
                {post.notes && <p className="text-xs text-slate-400 mt-1">{post.notes}</p>}
              </div>
              {post.datePublished && (
                <p className="text-xs text-slate-400 shrink-0">{post.datePublished}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Article templates */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Article Templates</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {ARTICLE_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTemplate(i)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-lg border transition-all",
                activeTemplate === i
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {t.type}
            </button>
          ))}
        </div>
        <pre className="bg-slate-50 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-wrap font-mono overflow-auto max-h-96">
          {ARTICLE_TEMPLATES[activeTemplate].structure}
        </pre>
      </div>

      {/* Posting schedule */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-3">Weekly Content Schedule</h2>
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {[
            { day: "Mon", task: "Write blog draft", color: "bg-blue-50 text-blue-700" },
            { day: "Tue", task: "LinkedIn post (company insight)", color: "bg-purple-50 text-purple-700" },
            { day: "Wed", task: "Finish + publish blog", color: "bg-green-50 text-green-700" },
            { day: "Thu", task: "LinkedIn post (PM lesson)", color: "bg-purple-50 text-purple-700" },
            { day: "Fri", task: "Start next company analysis", color: "bg-orange-50 text-orange-700" },
            { day: "Sat", task: "Repurpose blog as thread", color: "bg-yellow-50 text-yellow-700" },
            { day: "Sun", task: "Plan next week's content", color: "bg-slate-50 text-slate-600" },
          ].map(({ day, task, color }) => (
            <div key={day} className={`rounded-lg p-2 ${color}`}>
              <p className="font-bold">{day}</p>
              <p className="mt-1 leading-tight">{task}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
