from agents import build_search_agent,build_reader_agent, writer_chain, critic_chain

def run_research_pipeline(topic : str)-> dict:
    state={}

    #search agent working

    print("\n"+" ="*50)
    print("search agent working")
    print("="*50)
    search_agent = build_search_agent()
    search_result=search_agent.invoke({
        "messages" : [("user",f"find recent, reliable and detailed information about: {topic}")]
    })

    state["search_results"] = search_result['messages'][-1].content

    print("\n search result", state["search_results"])

    #step 2 -reader agent

    print("\n"+" ="*50)
    print("scrapping started by reader agent")
    print("="*50)

    reader_agent=build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [("user",
            f"Based on the following search results about '{topic}', "
            f"pick the most relevant URL and scrape it for deeper content.\n\n"
            f"Search Results:\n{state['search_results'][:800]}"
        )]
    })

    state['scrapped_content']=reader_result['messages'][-1].content
    print("\nscrapped content",state['scrapped_content'])

    #step 3 -writer chain

    print("\n"+" ="*50)
    print("writer chain working")
    print("="*50)

    research_combined = (
        f"SEARCH RESULTS : \n {state['search_results']}\n\n"
        f"DETAILED SCRAPED CONTENT : \n {state['scrapped_content']}"
    )

    state["report"] = writer_chain.invoke({
        "topic" : topic,
        "research" : research_combined
    })

    print("\n Final Report\n",state['report'])

    #critic report

    print("\n"+" ="*50)
    print("project evaluation by critic")
    print("="*50)

    state["feedback"] = critic_chain.invoke({
        "report" : state['report']
    })

    print("\n critic report\n",state['feedback'])

    return state


if __name__ == "__main__":
    topic=input("\n Enter a research topic")
    run_research_pipeline(topic)