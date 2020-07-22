# XAI FakeNews (Phase II)

- add short project description here -

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What you need to install:

```
Node.js v 10
MangoDB
NPM
```


## Running the tests


How to run on your local machine


```
npm run dev
http://localhost:4000/
```

To run a study and controll the conditions: 

```
cond1: the first interface condition that user will see.
cond2: the second interface condition that user will see. 
usr: controls the features for different user types. 
```

Where conditions are:

```
basic: No AI condition
simple: AI condition
intermediate: AI with some explanations
expert: AI with all explanations 
```

And users are: 

```
god: god-mode lets you easily review the interface 
mturk: mturk-mode is the user ready mode for studies 
```

E.g.: for god-mode go to: 

```
http://localhost:4000/begin/trueNewsSelectionStudy?cond1=expert&cond2=expert&usr=god
```

for mturk-mode go to: 

```
http://localhost:4000/begin/trueNewsSelectionStudy?cond1=expert&cond2=expert&usr=mturk
```

### Loading Data into DB

First save the crawled dataset and model outputs in:

```
.\xai_snopes\xai_snopes_v-X\
and 
.\xai_snopes\batch-X\

```

Then run:

```
node .\scripts\ingestDataBatch.js .\xai_snopes\batch-X
```

## Deployment

TBD