from langchain.agents import create_agent
from langchain_mistralai import ChatMistralAI

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from tools import web_search , scrape_url

from dotenv import load_dotenv

load_dotenv()

#model
llm0 = ChatMistralAI(
    model="mistral-small-latest",   
    max_tokens=800,
    temperature=0.2
)

llm1 = ChatMistralAI(
    model="mistral-small-latest",   
    max_tokens=5000,
    temperature=0.2
)
llm2 = ChatMistralAI(
    model="mistral-small-latest",   
    max_tokens=500,
    temperature=0.2
)


#1st agent
def build_search_agent():
    return create_agent(
        model=llm0,
        tools=[web_search]
    )

#2nd agent

def build_reader_agent():
    return create_agent(
        model=llm0,
        tools=[scrape_url]
    )

#writer chain

writer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert academic writer. Write factual IEEE-style research reports using only the provided research. Never invent facts, citations, or sources."
    ),
    (
        "human",
        """
Topic:
{topic}

Research:
{research}

Write a comprehensive IEEE-style research report.

Required sections (do not omit any):

Title

Abstract

Keywords

1. Introduction

2. Background

3. Key Findings
- Include at least 5 detailed findings.
- Explain each finding with evidence, examples, and implications.

4. Challenges

5. Future Scope

6. Conclusion

References

Requirements:
- Formal academic tone.
- Use plain text only (no Markdown).
- Develop each section with multiple well-structured paragraphs.
- Base every statement on the supplied research.
- Do not fabricate information.
- Include every source URL in the References section.
"""
    ),
])

writer_chain = writer_prompt | llm1 | StrOutputParser()

#strOutputParser is used to make the output look good

#critic_chain

critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an IEEE reviewer. Give concise, constructive feedback."
    ),
    (
        "human",
        """
Review this report.

{report}

Return:

Score: X/10

Strengths:
1.
2.
3.

Weaknesses:
1.
2.
3.

Verdict:
One short paragraph.
"""
    ),
])

critic_chain = critic_prompt | llm2 | StrOutputParser()
