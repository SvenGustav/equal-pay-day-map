# The Unpaid Year

A small project built for the **Build for Impact: Labor Rights Data Hackathon**.

## About the hackathon

Build for Impact was a one-evening online hackathon hosted by [Data & AI Stockholm](https://luma.com/dataaistockholm) in collaboration with [Lovable](https://lovable.dev), held on **Wednesday 13 May 2025** over Discord.

The theme was labor rights. May is the month most associated with workers' movements, and the organizers wanted to mark it by getting people to actually *build* something with labor data, rather than sit through another panel discussion.

The format was tight on purpose:

- A short kick-off call on Discord to introduce the theme and walk through the datasets
- **2.5 hours** to build, solo, whatever you wanted
- Discord stayed open the whole time for questions, progress updates and general chatter
- Participants got Lovable credits to help them ship something quickly

Everyone worked from the same pool of Eurostat datasets:

- Employed persons by job tenure
- Employment rate by sex
- **Gender pay gap in unadjusted form** ← the one I picked
- In-work at-risk-of-poverty rate by sex
- Mean weekly hours usually worked per employee by sex (annual)

The brief was deliberately open: an app, a dashboard, a visualization, an essay-with-charts — anything that highlighted or explored labor rights through the data. Top three projects would be recognized, with the winner getting to present in the Lovable Discord community and a small prize from DAIS.

The audience was people already comfortable with data — analysts, engineers, data scientists — who wanted an excuse to build something meaningful in an evening instead of doomscrolling.

## The project

Picked the unadjusted gender pay gap dataset and turned the percentages into calendar dates — Equal Pay Day per country, 2007–2024, with a slider, a salary calculator, and shareable cards.
See a Demo of the project: https://equal-pay-day-map.lovable.app/

## Built with

Lovable, React, TypeScript, Eurostat open data.

## License

Code: MIT. Data: © European Union, reused under Eurostat's [copyright policy](https://ec.europa.eu/eurostat/help/copyright-notice).
