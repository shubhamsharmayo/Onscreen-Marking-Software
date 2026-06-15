# 🎓 Onscreen Marking Software

A scalable digital evaluation platform designed for universities, colleges, and educational institutions to manage large-scale answer booklet evaluation workflows digitally.

The system automates the complete answer sheet evaluation lifecycle — from booklet upload and evaluator assignment to annotation-based checking, review workflows, and final result generation.

---

# 📚 Table of Contentsa

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Core Features](#-core-features)
- [Evaluation Workflow](#-evaluation-workflow)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Backend Architecture](#-backend-architecture)
- [Frontend Features](#-frontend-features)
- [Project Structure](#-project-structure)
- [Key Capabilities](#-key-capabilities)
- [Result Generation](#-result-generation)
- [Scalability Features](#-scalability-features)
- [Security Features](#-security-features)
- [Future Improvements](#-future-improvements)
- [Use Cases](#-use-cases)
- [Conclusion](#-conclusion)

---

# 📖 Overview

Onscreen Marking Software is a full-stack digital answer booklet evaluation platform developed to replace traditional manual checking systems used in educational institutions.

The platform enables:

- Digital evaluation of answer sheets
- Bulk booklet processing
- Real-time evaluation monitoring
- Annotation-based checking
- Multi-level verification workflows
- Automated result generation
- Scalable evaluator assignment

The software is optimized for handling thousands of answer booklets efficiently using asynchronous processing, queue workers, and real-time communication systems.

---

# ❗ Problem Statement

Traditional answer booklet evaluation systems suffer from multiple issues:

- Manual checking delays
- Lack of transparency
- Difficult evaluator coordination
- No centralized monitoring
- Human calculation errors
- Complex booklet handling workflows
- Slow result generation

This platform solves these problems by digitizing the complete evaluation process.

---

# 🚀 Core Features

# 1. Evaluation Schema Management

Administrators can create evaluation schemas that define rules for examinations.

## Features

- Define total number of questions
- Configure question-wise marks
- Set minimum evaluation time
- Set maximum evaluation time
- Configure subject-wise evaluation rules
- Validation-based checking system
- Flexible evaluation configurations

## Example

A university can define:

```text
Subject: Mathematics
Questions: 10
Minimum Evaluation Time: 20 mins
Maximum Evaluation Time: 45 mins
```

---

# 2. Class & Subject Management

The system allows administrators to manage:

- Classes
- Subjects
- Subject-wise booklet organization
- Subject evaluation configurations

## Capabilities

- Create classes dynamically
- Create multiple subjects
- Link subjects with evaluation schemas
- Manage subject evaluation workflows

---

# 3. Schema-to-Subject Mapping

Evaluation schemas can be dynamically connected with subjects.

## Benefits

- Different evaluation rules for different subjects
- Reusable schema templates
- Subject-level evaluation customization
- Flexible examination workflows

---

# 4. Multi-Role User Management

The platform supports multiple user roles with role-based access control.

---

## 👨‍🏫 Evaluator

Responsibilities:

- Check answer booklets
- Add annotations
- Assign marks question-wise
- Submit evaluated booklets

---

## 👨‍💼 Reviewer

Responsibilities:

- Verify evaluator checking
- Approve correctly checked booklets
- Rollback incorrectly evaluated booklets

---

## 👨‍⚖️ Head Evaluator

Responsibilities:

- Resolve evaluator-reviewer conflicts
- Make final evaluation decisions
- Supervise complete evaluation workflow

⚠️ Only one Head Evaluator exists in the entire system.

---

## 👨‍💻 Admin

Responsibilities:

- Manage complete system
- Manage users and workflows
- Generate reports and final results
- Monitor evaluation progress

---

# 5. Bulk Booklet Upload & Processing

The platform supports uploading thousands of answer booklets simultaneously.

## Features

- Bulk PDF upload
- Automatic booklet extraction
- Queue-based processing
- Asynchronous image extraction
- Automatic evaluator assignment
- Background workers for processing

As soon as booklets are assigned to evaluators, page extraction starts automatically.

---

# 6. Digital Evaluation & Annotation System

Evaluators can digitally evaluate answer sheets using annotation tools.

## Supported Annotations

- ✔ Right mark
- ❌ Wrong mark
- Tick/Cross marking
- Question highlighting
- Visual corrections
- Marks allocation
- Annotation overlays

## Stored Evaluation Data

- Question-wise marks
- Total marks
- Annotation history
- Evaluation metadata
- Reviewer feedback

---

# 🔄 Evaluation Workflow

The system follows a hierarchical booklet verification workflow.

---

# Step 1: Evaluator Checks Booklet

```text
Evaluator → Reviewer
```

The evaluator:

- Opens assigned booklet
- Checks answers
- Adds annotations
- Assigns marks
- Submits booklet for review

---

# Step 2: Reviewer Verification

The reviewer verifies the evaluator’s checking.

---

## ✅ If Evaluation is Correct

```text
Reviewer → Final Submission
```

The booklet is finalized successfully.

---

## ❌ If Evaluation Contains Problems

```text
Reviewer → Evaluator (Rollback)
```

The booklet is returned to evaluator for correction.

---

# Step 3: Conflict Resolution

If evaluator and reviewer disagree:

```text
Evaluator ↔ Reviewer → Head Evaluator
```

The Head Evaluator reviews the booklet and makes the final decision.

---

# 📊 Result Generation

After all booklets are evaluated:

## Admin Can

- Download checked answer booklets
- View question-wise marks
- View total marks
- Generate final results
- Export results in CSV format

---

## Generated CSV Includes

- Student details
- Subject marks
- Question-wise marks
- Total marks
- Final evaluated result

---

# 🏗 System Architecture

The application follows a modular scalable architecture.

---

# Backend Modules

## Authentication System

Handles:

- Login
- Authorization
- OTP handling
- Session management
- Role-based access control

---

## Evaluation Engine

Handles:

- Annotation processing
- Marks allocation
- Evaluation workflow
- Conflict resolution

---

## Booklet Processing Engine

Handles:

- PDF uploads
- Image extraction
- Queue processing
- Background workers

---

## Result Generation Module

Handles:

- Marks calculation
- CSV export
- Final result generation

---

## Real-Time Communication

Implemented using:

- Socket.IO
- Live evaluation updates
- Real-time monitoring

---

# 🧰 Tech Stack

# Frontend

- React.js
- Tailwind CSS
- JavaScript
- PDF WebViewer

---

# Backend

- Node.js
- Express.js
- MongoDB

---

# Real-Time & Queue Processing

- Socket.IO
- Redis
- Bull Queue

---

# PDF & Annotation Tools

- PDF Image Extraction
- Annotation Engine
- PDF WebViewer

---

# ⚙ Backend Architecture

The backend follows a layered architecture.

## Structure

```bash
controllers/
models/
routes/
services/
middlewares/
workers/
socket/
utils/
```

---

# Controllers

Handle business logic for:

- Authentication
- Evaluation
- Booklet processing
- Result generation

---

# Models

MongoDB models for:

- Users
- Subjects
- Classes
- Schemas
- Booklets
- Marks
- Tasks

---

# Services

Reusable services for:

- PDF extraction
- CSV generation
- Email handling
- Redis queues

---

# Workers

Background workers for:

- Annotation processing
- Image extraction
- Queue handling

---

# 🖥 Frontend Features

The frontend provides separate dashboards for different user roles.

## Features

- Admin Dashboard
- Evaluator Dashboard
- Reviewer Dashboard
- PDF Annotation Interface
- Real-time evaluation updates
- Analytics monitoring
- Responsive UI

---

# 📁 Project Structure

```bash
Onscreen-Marking-Software/
│
├── On-Screen-Marking-Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   ├── Workers/
│   ├── utils/
│   ├── Middlewares/
│   └── server.js
│
└── Onscreen Marking Frontend/
    ├── src/
    ├── public/
    ├── components/
    ├── pages/
    └── package.json
```

---

# ⚡ Key Capabilities

- Large-scale booklet processing
- Real-time evaluation monitoring
- Annotation-based checking
- Queue-based asynchronous processing
- Role-based access management
- Multi-level evaluation workflow
- Conflict resolution system
- Automated result generation
- Scalable backend architecture

---

# 📈 Scalability Features

The platform is designed for high scalability.

## Scalability Implementations

- Redis queue processing
- Bull workers
- Asynchronous PDF extraction
- Background task processing
- Modular architecture
- Scalable MongoDB collections

The system can process thousands of booklets simultaneously.

---

# 🔐 Security Features

## Security Implementations

- Role-based access control
- Authentication middleware
- Session management
- OTP verification
- Protected API routes
- Validation layers

---

# 🔮 Future Improvements

Planned future enhancements include:

- AI-assisted evaluation
- OCR-based answer detection
- Analytics dashboard
- Evaluation heatmaps
- Multi-university support
- Cloud storage integration
- Audit logs
- Auto-scaling workers
- AI-generated evaluation suggestions

---

# 🏫 Use Cases

Suitable for:

- Universities
- Colleges
- Examination Boards
- Government Examination Authorities
- Certification Organizations
- Digital Assessment Centers

---

# ✅ Conclusion

Onscreen Marking Software digitizes and automates the complete answer booklet evaluation lifecycle.

By combining:

- scalable booklet processing,
- annotation-based evaluation,
- hierarchical verification workflows,
- real-time monitoring,
- and automated result generation,

the platform significantly improves evaluation efficiency, transparency, scalability, and accuracy for educational institutions.

---
