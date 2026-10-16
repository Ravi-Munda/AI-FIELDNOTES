# AI Fieldnotes

**A focused exam-practice web app for Introduction to Artificial Intelligence.**

AI Fieldnotes is a browser-based quiz application designed to help students practise AI fundamentals in an exam-style environment. It combines a structured question bank, timed assessments, progress tracking, and an installable web-app experience in one place.

<p align="center">
  <a href="https://ravi-munda.github.io/AI-FIELDNOTES/"><strong>Launch AI Fieldnotes →</strong></a>
  &nbsp; · &nbsp;
  <a href="https://github.com/Ravi-Munda/AI-FIELDNOTES">View Source Code</a>
</p>

## Overview

Preparing for an exam requires more than reading notes. You also need to practise answering questions, manage your time, and review your progress.

AI Fieldnotes provides a dedicated space to practise multiple-choice questions related to the Introduction to Artificial Intelligence course. Its exam-style interface helps learners work through a timed quiz while keeping track of their answers and progress.

## Features

- **100-question practice session** — work through a question bank worth 100 marks.
- **Timed assessment** — practise with a 90-minute countdown.
- **Multiple-choice questions** — select from four answer options.
- **Difficulty levels** — questions are organised into Easy, Medium, and Hard categories.
- **Question navigation** — move between questions and track answered or flagged questions.
- **Progress persistence** — save an unfinished attempt and resume it in the same browser.
- **Performance tracking** — keep track of completed quizzes and daily practice streaks.
- **Rank badges** — build consistency through the app's progress and ranking system.
- **Installable web app** — install it on supported devices through a compatible browser.
- **Offline support** — the service worker supports offline access after the necessary resources have been cached.
- **Responsive interface** — use the app on supported desktop and mobile browsers.

## Live Demo

**Try it here:** [AI Fieldnotes](https://ravi-munda.github.io/AI-FIELDNOTES/)

The live version is hosted using GitHub Pages. You can also run the project locally using Python.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and interface |
| CSS3 | Layout, styling, and responsive presentation |
| JavaScript | Quiz logic, navigation, timer, and progress tracking |
| Python 3 | Optional local development server |
| JSON | Stores the quiz question bank |
| Web App Manifest | Provides installation metadata |
| Service Worker | Supports caching and offline access |
| Browser Local Storage | Saves quiz attempts and practice progress |

The local Python server uses Python's standard library, so no third-party Python packages are required for the basic local setup.

## Run Locally

### Prerequisites

- Python 3 installed on your computer.
- Git installed if you want to clone the repository.
- A modern web browser.

### 1. Clone the repository

```bash
git clone https://github.com/Ravi-Munda/AI-FIELDNOTES.git
cd AI-FIELDNOTES
```

### 2. Start the local server

On Windows:

```bash
python AIQuiz.py
```

On macOS or Linux:

```bash
python3 AIQuiz.py
```

### 3. Open the application

The server normally opens your browser automatically. If it doesn't, visit:

```text
http://localhost:8000
```

To choose another port:

```bash
python AIQuiz.py --port 8080
```

Then open `http://localhost:8080`.

To start the server without automatically opening a browser:

```bash
python AIQuiz.py --no-browser
```

Press `Ctrl+C` in the terminal to stop the server.

## Project Structure

```text
AI-FIELDNOTES/
├── .github/
│   └── workflows/       # GitHub workflow configuration
├── icons/               # App icons
├── publish/             # Publishing-related files
├── AIQuiz.py            # Optional local web server
├── app.js               # Quiz and application logic
├── index.html           # Main application page
├── styles.css           # Interface styling
├── questions.json       # Quiz question bank
├── manifest.webmanifest # Installable web-app metadata
├── sw.js                # Service worker and caching
├── favicon.svg          # Browser icon
└── LICENSE              # MIT license
```

## How Progress Is Saved

AI Fieldnotes uses browser Local Storage to keep quiz attempts and practice-profile information on the current browser.

This means:

- Your saved progress is associated with that browser and device.
- Progress is not automatically synchronised across devices.
- Clearing the saved app data or browser storage can remove your progress.
- Use the app's clear-progress option if you want to reset your local practice data.

## Who Is This For?

- Students revising Introduction to Artificial Intelligence.
- Learners who want timed multiple-choice practice.
- Anyone looking for a simple way to build a regular study routine.
- Developers interested in learning from a small web application that combines JavaScript, JSON, browser storage, and Progressive Web App features.

## Current Scope

AI Fieldnotes is a practice and revision tool. It should not be treated as an official examination platform, an official course resource, or a guarantee of exam performance.

The question bank and practice experience are intended to support independent revision.

## Future Improvements

Potential areas for future development include:

- More question sets and topic-based practice.
- A review screen explaining answers after submission.
- More detailed performance summaries by topic and difficulty.
- Importable question sets for other subjects.
- Improved accessibility and usability testing.
- Additional tests for quiz logic and saved-progress handling.

## Contributing

Suggestions, bug reports, and improvements are welcome.

1. Fork this repository.
2. Create a branch for your change.
3. Make and test your changes.
4. Submit a pull request describing what you changed.

## License

This project is distributed under the [MIT License](LICENSE).

## Author

**Ravi Munda**

- GitHub: [@Ravi-Munda](https://github.com/Ravi-Munda)
- Project: [AI Fieldnotes](https://github.com/Ravi-Munda/AI-FIELDNOTES)

---

*Learn with focus. Practise with purpose. Improve with consistency.*
