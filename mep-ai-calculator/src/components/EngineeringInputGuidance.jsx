import { useEffect } from "react";
import { getEngineeringInputGuidance } from "./engineeringInputGuidance";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export default function EngineeringInputGuidance() {
  useEffect(() => {
    const enhance = () => {
      document.querySelectorAll(".engineering-help-popover").forEach((popover) => {
        if (popover.dataset.guidanceEnhanced === "true") return;
        const heading = popover.querySelector("strong");
        const label = heading?.textContent?.trim();
        const guidance = getEngineeringInputGuidance(label);
        if (!guidance) return;

        const details = document.createElement("div");
        details.className = "engineering-help-details";
        details.innerHTML = `
          <div><b>Reference:</b> ${escapeHtml(guidance.reference)}</div>
          <div><b>Look for:</b> ${escapeHtml(guidance.lookFor)}</div>
          <div><b>Feeds into:</b> ${escapeHtml(guidance.feeds)}</div>
          <div><b>Verify:</b> ${escapeHtml(guidance.verify)}</div>
        `;
        popover.appendChild(details);
        popover.dataset.guidanceEnhanced = "true";
      });
    };

    const styleId = "engineering-input-guidance-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .engineering-help-details{margin-top:9px;padding-top:8px;border-top:1px solid #e2e8f0;color:#334155;font-size:11.5px;line-height:1.42}
        .engineering-help-details>div{margin-top:5px}
        .engineering-help-details>div:first-child{margin-top:0}
        .engineering-help-details b{color:#0f172a}
      `;
      document.head.appendChild(style);
    }

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
