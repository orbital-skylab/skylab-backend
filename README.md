# NUS Skylab v2 - Backend

Skylab v2 is a student-developed project to support [NUS Orbital (CP2106)](https://orbital.comp.nus.edu.sg/) by allowing students, advisers, mentors, and administrators to use the platform to run the program.

> **Orbital** (a.k.a., CP2106: Independent Software Development Project) is the School of Computing’s 1st year summer self-directed, independent work course. This programme gives students the opportunity to pick up software development skills on their own, using sources on the web. All while receiving course credit in the form of 4 modular credits of Unrestricted Electives (UE). SoC provides the Orbital framework for helping students stay motivated and driven to complete a project of their own design, by structuring peer evaluation, critique and presentation milestones over the summer period.

Skylab v2 has the intention of replacing the pre-existing [Skylab](https://nusskylab-dev.comp.nus.edu.sg/) for the following reasons:

1. To use a modern tech stack to that it is easier for more students to be enrolled to maintain the platform
   - Skylab v1 uses Ruby on Rails
   - Skylab v2 uses PERN
2. To improve pre-existing features to support the UX of administrators
3. To revamp the existing UI to provide a more intuitive workflow for all users of the platform.

## Installation

1. Install [Node.js](https://nodejs.org/en/) on your system
   - You can type `node -v` into a terminal to check if you have it installed
2. Clone the repo into a directory of your choice by typing `git clone https://github.com/orbital-skylab/skylab-frontend` into a terminal
3. Navigate to the 'skylab-frontend' directory by typing `cd skylab-frontend`
4. Install the packages by typing `npm install`
6. Place the `.env` file in the root directory of the project

## Start the application

1. Ensure that you are in the `skylab-backend` directory
2. Type `npm run dev` into the terminal
3. Navigate to http://localhost:4000 to call API endpoints from the running server.

## Documentation

Documentation for this project is done using [GitHub Wiki](https://github.com/orbital-skylab/skylab-backend/wiki). 
