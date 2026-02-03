from pathlib import Path
import re


def test_combined_summary_scroll_is_internal():
    styles_path = (
        Path(__file__).resolve().parents[2]
        / "src"
        / "mcp_feedback_enhanced"
        / "web"
        / "static"
        / "css"
        / "styles.css"
    )
    styles = styles_path.read_text(encoding="utf-8")

    assert re.search(
        r"#tab-combined\s*\{[^}]*overflow:\s*hidden",
        styles,
        re.S,
    )
    assert re.search(
        r"#tab-combined\s+\.combined-content\s*\{[^}]*min-height:\s*0",
        styles,
        re.S,
    )
