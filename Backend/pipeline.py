from typing import Any, Callable, Optional
import re

from agents import build_reader_agent, build_search_agent, critic_chain, writer_chain


def parse_search_results(raw_text: str) -> list[dict[str, str]]:
    raw = raw_text or ''
    entries: list[dict[str, str]] = []
    parts = re.split(r'\n[-]{3,}\n', raw)

    for part in parts:
        title = ''
        url = ''
        snippet_lines: list[str] = []

        for line in part.splitlines():
            line = line.strip()
            if not line:
                continue
            lower = line.lower()
            if lower.startswith('title:'):
                title = line.split(':', 1)[1].strip()
            elif lower.startswith('url:'):
                url = line.split(':', 1)[1].strip()
            elif lower.startswith('snippet:'):
                snippet_lines.append(line.split(':', 1)[1].strip())
            else:
                snippet_lines.append(line)

        if url:
            entries.append({
                'title': title or url,
                'url': url,
                'snippet': ' '.join(snippet_lines).strip(),
            })

    return entries


def summarize_url(reader_agent, url: str, topic: str) -> str:
    prompt = (
        'You are a focused research assistant. Use your scrape_url tool to fetch the page at the URL below, ' \
        'then return a concise structured summary in Markdown with headings and bullet points. ' \
        'Include exactly these sections: Main Findings, Important Facts/Statistics, Applications, Limitations (if present), and Source URL. ' \
        'Keep the summary concise, factual, and directly relevant to the topic. Do not include raw page content or HTML. ' \
        'If the page cannot be scraped, explain the failure in one short sentence and still return the Source URL.\n\n'
        f'Topic: {topic}\n'
        f'URL: {url}\n'
    )

    result = reader_agent.invoke({
        'messages': [
            (
                'user',
                prompt,
            )
        ]
    })

    return result['messages'][-1].content


def normalize_summary_lines(summaries: list[str]) -> str:
    seen: set[str] = set()
    merged_lines: list[str] = []

    for summary in summaries:
        for line in summary.splitlines():
            cleaned = line.strip()
            if not cleaned:
                continue
            if cleaned.startswith(('###', '##', '#')):
                merged_lines.append(cleaned)
                continue
            bullet = re.sub(r'^[-*\u2022]\s*', '', cleaned)
            normalized = re.sub(r'\s+', ' ', bullet.lower())
            if normalized in seen:
                continue
            seen.add(normalized)
            if cleaned.startswith(('-', '*', '•')):
                merged_lines.append(f'- {bullet}')
            else:
                merged_lines.append(cleaned)

    return '\n'.join(merged_lines)


def build_structured_research_context(summaries: list[dict[str, str]]) -> str:
    blocks: list[str] = []
    for summary in summaries:
        blocks.append(f"### Source: {summary['url']}")
        blocks.append(summary['summary'].strip())
        blocks.append('')

    merged = normalize_summary_lines(blocks)
    return 'Here are the structured source summaries for the writer agent:\n\n' + merged


def run_research_pipeline(
    topic: str,
    step_callback: Optional[Callable[[str, dict[str, Any]], None]] = None,
) -> dict[str, Any]:
    state: dict[str, Any] = {
        "topic": topic,
        "status": "running",
        "current_step": "started",
        "progress": 0,
        "steps": {},
    }

    def emit(step_name: str, message: str) -> None:
        state["current_step"] = step_name
        state["steps"][step_name] = {"status": "completed", "message": message}
        if step_callback:
            step_callback(step_name, state)

    try:
        print("\n" + " =" * 50)
        print("search agent working")
        print("=" * 50)
        search_agent = build_search_agent()
        search_result = search_agent.invoke({
            "messages": [
                (
                    "user",
                    f"Find the top 5 most relevant recent URLs for this research topic. "
                    f"Return each result as Title, URL, and a short snippet.\n\nTopic: {topic}",
                )
            ]
        })

        raw_search_text = search_result["messages"][-1].content
        state["search_results"] = raw_search_text
        state["progress"] = 15
        emit("search", "Search completed")
        print("\n search result", raw_search_text)

        search_entries = parse_search_results(raw_search_text)
        unique_urls: set[str] = set()
        unique_entries: list[dict[str, str]] = []
        for entry in search_entries:
            if entry["url"] in unique_urls:
                continue
            unique_urls.add(entry["url"])
            unique_entries.append(entry)
            if len(unique_entries) >= 5:
                break

        search_entries = unique_entries
        state["search_entries"] = search_entries
        state["progress"] = 25

        print("\n" + " =" * 50)
        print("reader agent scraping selected URLs")
        print("=" * 50)

        reader_agent = build_reader_agent()
        summaries: list[dict[str, str]] = []

        for entry in search_entries:
            summary_text = summarize_url(reader_agent, entry["url"], topic)
            summaries.append({
                "url": entry["url"],
                "title": entry["title"],
                "summary": summary_text,
            })

        state["scrapped_content"] = "\n\n".join(
            [f"Source: {item['url']}\n{item['summary']}" for item in summaries]
        )
        state["progress"] = 50
        emit("scraping", "Scraping completed")
        print("\nscrapped content", state["scrapped_content"])

        print("\n" + " =" * 50)
        print("writer chain working")
        print("=" * 50)

        research_combined = build_structured_research_context(summaries)

        state["report"] = writer_chain.invoke({"topic": topic, "research": research_combined})
        state["progress"] = 75
        emit("writing", "Report generated")
        print("\n Final Report\n", state["report"])

        print("\n" + " =" * 50)
        print("project evaluation by critic")
        print("=" * 50)

        state["feedback"] = critic_chain.invoke({"report": state["report"]})
        state["progress"] = 100
        state["status"] = "completed"
        emit("review", "Feedback generated")
        print("\n critic report\n", state["feedback"])

        return state
    except Exception as exc:
        state["status"] = "failed"
        state["error"] = str(exc)
        state["current_step"] = "failed"
        state["steps"]["failed"] = {"status": "failed", "message": str(exc)}
        if step_callback:
            step_callback("failed", state)
        raise


if __name__ == "__main__":
    topic = input("\n Enter a research topic")
    run_research_pipeline(topic)