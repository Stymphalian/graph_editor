# Graph Editor

This is a web-based graph (node/edge) editor application designed to allow
you to visually create and edit graphs. There is a text-panel to show you 
the text (edge-list format) representation of the graph allowing you to easily
copy and paste the graph data. The TextPanel and GraphViewer are synchronized 
so any edits made in either are bidirectionally communicated.
The graph editor is based on this [tool](https://csacademy.com/app/graph_editor/)
from CS Academy.

![preview image](/docs/preview.png)

## Features
- **Interactive Graph Visualization**: View and manipulate graphs visually with a dynamic, responsive canvas.
- **Text-Panel (Edge List Editor)**: Edit the graph structure directly using a synchronized text-based edge list panel.
- **Bidirectional Sync**: Changes in the text-panel or visual editor are instantly reflected in both views.
- **View/Force Mode Toggle**: Switch between a static view mode and a force-directed layout for interactive graph arrangement.
- **Node Indexing Controls**: Choose between 0-based and 1-based node indexing to match your data or algorithm needs.
- **Graph Type Selection**: Easily switch between directed and undirected graph modes.
- **Node and Edge Editing**: Add, remove, and relabel nodes and edges with intuitive controls.
- **Copy & Paste Support**: Quickly copy the graph's edge list or paste new data for rapid prototyping.

## Technology
- **React 18** – UI framework for building interactive components
- **TypeScript** – Type-safe development for React and logic
- **Vite** – Fast development server and build tool
- **Tailwind CSS v4** – Utility-first CSS framework for styling
- **D3.js** – Graph layout and force simulation
- **Jest** & **React Testing Library** – Unit and integration testing


## Overview
This entire project was an experiment for me to use Agentic coding agents (Cursor)
and get the experience of the benefits and shortcomings of these kinds of tools. 
In all, it took me around 5-6 days of almost continuous coding. There were many periods of extremely quick development, but 
also many **many** hours trying to force Cursor to implement something specific, 
or trying to track down a weird visual or interaction bug that Cursor couldn't fix.

I tried not to read through all the code changes too much and mostly *vibe* coded
the majority of the features. So if you read through commit messages and they don't
make any sense with the change, it is because I just clicked accept without reading
through it. 

In the end, I got quite comfortable with prompting the agent and had a relatively 
efficient process/workflow for getting through features and changes.

The overall process looked like this:

1. To start off the project, I used this template from snarktank [ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks)
2. This gives you a starting point for having the Agent write out a features/requirements doc,
   and then distilling out a Tasks document outlining step-by-step tasks for implementing your feature.
3. In the `.ai` folder, I have `instructions` and a `tasks` folder. The `instructions`
contains the instruction documents (copied from snarktank), and the `tasks` folder
has the generated PRD/task markdown files.
4. From there, you slowly work through each Task one sub-task at a time. The process
is to have it work through one sub-task, you manually review the changes, and then 
you create a new git commit for the changes from that sub-task. 
5. In each step, I usually didn't read the code but I do manually verify the
functionality and behavior in the app itself. You can iterate/chat with the Agent
to make adjustments or fix failures as you see them.
6. Once each sub-task is complete, I like to make a git commit in case I want to roll
back quickly if the Agent makes a terrible mess of the code while implementing the next sub-task.
7. Like any good/normal software development process, you want to leave the code base
in a good/runnable state on each commit. So we have rules for the Agent to always 
write and run tests for each task.
8. This process/workflow got me through most of the main features of the App. 
You can see progress in the [tasks-prd-graph-editor.md](/.ai/tasks/tasks-prd-graph-editor.md) markdown file.
Having the agent get through one full Task with you baby-sitting it through each sub-task
usually took me around 30-60 mins depending on the size of the feature.
9. I didn't end up implementing all the tasks, as I think the main functionality there
was already pretty good and I wanted to move on to do some other stuff.
10. Throughout the process and also especially near the end, I started to ask the Agent
to do "one-off" changes and fixes. Instead of using the task/prd documents, this is
purely a chat prompting exercise. Cursor is quite sophisticated in that it knows
when to gather context from the codebase in order to understand what you are talking about.
I'm not sure how well this scales for larger codebases, but at least for this project 
it works exceptionally well.


Here are some of my big takeaways and learnings of how to work with Agentic tools like Cursor:

**Green Doc, Blue Doc**
- The PRD and Tasks doc method I used from [snarktank](https://github.com/snarktank/ai-dev-tasks)
is very similar to how most SW companies plan and create new features. At Google,
you would first start with a Green doc (outline of features, architecture, stakeholders, requirements, technologies, etc)
and after the team review, the engineers would write the Blue doc which gave a far 
more detailed breakdown of specific tasks and implementation details. It's nice to
know we can use a similar method to get AI Agents to do things. Spending more time on
a good, clear Green doc makes creating an accurate Blue doc much easier (implying a very straightforward implementation phase)

**Careful at the Start**
- The agents are extremely powerful and will probably cobble something together that will *work*. 
But it might not be how **you** want it to work. Like any normal project, there are usually 
tradeoffs and multiple solutions to the same problem. The Agent will use *a* solution and 
it is your job to make sure it implements the one that **you** want to use.
- This means, at least when having the Agent start a new project or a big new feature, you 
should be careful when it starts writing out the foundational files. Things like the 
data/model files, or the basic architecture for state management, or whatever. It pays
to know what good software patterns are to follow for your particular feature/problem and to make
sure the Agent is following those practices. It is too easy to have the Agent make something 
_working_ but it will eventually come to bite you in the ass as the codebase grows larger.

**Stay Aware**
- At some point during my workflow, I started having the Agent first summarize/describe what changes
it will make before doing any implementation/file changes for a sub-task. This helped a lot as I could first see
if the Agent would go in the right direction or not. Like most things, it is much easier
to resolve bugs/issues/architectural issues BEFORE you have any code written. Having the Agent
do this summary allowed me to give feedback to the Agent and also gave me a chance to understand
any software design patterns/data modeling patterns it was going to use.
- It pays to be proactive in understanding the Agent's direction for the code and
to iterate with it to better align to your expectations.

**Play Around**
- LLMs are by design non-deterministic. There were several times when I was trying
to have the LLM implement a scrollbar for the TextArea that it kept producing incorrect
behavior/code. I put it off for a while and came back the next day and reprompted it and it got it the first try. I don't think I made my prompt any more clear/instructive
but it was able to implement it with a different approach and it worked much better.
If you are having trouble being specific enough, or the task is too vague, sometimes it's
fine to just play around with the Agent and have it try new things until something sticks. 

**Rules Suck**
- Cursor provides the ability to write rules which get injected into the context.
This provides an easy way to have the Agent follow specific guidelines and procedures
as it works. I found the Agent very loosely follows these guidelines automatically.
For me specifically, I wanted the Agent to always create git commit after each sub-task,
instead of after each Task. No matter how I changed the instructions or configured
the rules files, I could not get the Agent to behave how I wanted. My takeaway is 
sometimes the rules suck but just do it manually if you have to. I still think the
Agent saves a ton of time and just having to do some extra baby-sitting by prompting the Agent
with "git add and commit" is not a bad trade-off.

**Everything looks like a nail**
- The agents are so powerful it is very *very* easy to just have the Agent do everything for you.
Need to rename a variable, prompt it to change it. Need to update an interface? prompt it.
Need to delete debug messages? Prompt. It is easy to forget that in software we have
very powerful deterministic tools (grep, etc) for doing simple and easy things. Use them when they are
appropriate and it will save you time and probably a lot of token usage. 

**Dollar Dollar Bill**
- LLM costs/token in general have trended down (at least given the relative performance) but they
can still be incredibly expensive. I was using Cursor Pro on trial for most of my usage
so it was mostly free. But a Pro subscription costs $20 USD/month with overage usage costs. 
I previously used Claude-cli with a direct API key instead of a subscription and the costs can add up very quickly.
It is easy to spend $2-5 for just one hour of pure vibe-coding. That is $50-60 for a single 8 hour 
workday. If you make a good salary of $100k, that is 1/8th of your daily wage JUST FOR ONE TOOL.
If you think about future use-cases of multi-background agents, or with image/multi-modal input 
and output, things can go awry very quickly.
- In my opinion, right now the AI user applications market is severely under-priced as I think
most companies are trying to get traction/market share and severely cutting their margins
to be competitive. They are only staying afloat due to massive VC funding and with the 
hopes of either getting market share, or a vision of massive technological improvements 
in inference time/cost/speed either algorithmically or via hardware.

## Future
Some things that I want to try in the future:
 - Make better use of the rules and instructions to allow for a more structured, predictable and repeatable use of the Agents.
   I think there is a lot of potential with using these rules to customize the Agent to a workflow that is efficient for you.
 - Play around with MCP, and also RAG systems to get more power out of the Agent. I'm sure as your codebase grows
   it would be much nicer to give it access to other documents/material outside of the codebase.
 - Experiment with background agents and using Agents for tasks other than coding. Things like documentation writing, automatic code cleanup/refactoring, etc.


