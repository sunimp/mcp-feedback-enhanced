# Summary Scroll & List Marker Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep AI summary scrolling inside its panel (not the page) and prevent combined summary list markers from being clipped.

**Architecture:** Lock the main layout height and move scrolling responsibility to the summary containers; adjust combined summary list styling to keep multi-digit markers inside the content box.

**Tech Stack:** HTML (Jinja templates), CSS

---

### Task 1: Reproduce and record baseline behavior

**Files:**
- None (manual verification)

**Step 1: Create a long AI summary and a Markdown list**

Use a summary with at least 3 screens of content and an ordered list from 1 to 12.

**Step 2: Record current behavior**

Confirm the page scrolls (not just the summary), and observe whether the "10/11/12" markers are clipped in the combined summary panel.

---

### Task 2: Confine scrolling to the summary areas

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/static/css/styles.css`
- Modify: `src/mcp_feedback_enhanced/web/templates/feedback.html`

**Step 1: Lock the layout height and prevent page scrolling**

Add CSS rules to:

```css
html, body { height: 100%; }
body.layout-combined-vertical,
body.layout-combined-horizontal {
    overflow: hidden;
}
body.layout-combined-vertical .container,
body.layout-combined-horizontal .container {
    flex: 1;
    min-height: 0;
    height: 100%;
}
```

**Step 2: Make the summary tab content scroll internally**

In the feedback template styles, add:

```css
#tab-summary .input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

#summaryContent {
    flex: 1;
    overflow-y: auto;
}
```

**Step 3: Verify**

The page should no longer scroll. The summary area should scroll internally.

---

### Task 3: Prevent list marker clipping in combined summary

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/static/css/styles.css`

**Step 1: Adjust list marker positioning in combined summary**

Add styles:

```css
#combinedSummaryContent ol,
#combinedSummaryContent ul {
    list-style-position: inside;
    padding-left: 0.8em;
}
```

**Step 2: Verify**

The "10/11/12" markers should be fully visible and not clipped by the left border.

---

### Task 4: Regression check

**Files:**
- None (manual verification)

**Step 1: Check both combined layouts**

Verify combined-vertical and combined-horizontal still render correctly and summary scrolling works.

**Step 2: Check summary tab rendering**

Confirm Markdown elements still render as expected in the AI summary tab.
