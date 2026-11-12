# Task Board

A lightweight Kanban board for tracking work across a small team. Built with React, Vite, and Supabase.

Sign in with just your name, create tasks, drag them across columns, and collaborate with teammates through assignments, labels, and comments.

## Features

- **Kanban columns**: To Do, In Progress, In Review, and Done, with drag and drop to move tasks between them
- **Quick sign in**: enter a name and go, powered by Supabase anonymous auth
- **Priorities and due dates**: tasks show overdue, due today, and due soon badges at a glance
- **Team members**: search for other people by name, add them to your team, and give each one a color
- **Assignees**: assign tasks to teammates; tasks assigned to you by others appear on your board too
- **Labels**: create colored labels and tag tasks with them
- **Filters**: narrow the board by label, due date, or priority
- **Task details**: edit the title, description, status, priority, and due date in a side panel
- **Comments**: discuss a task right where the work lives
- **Activity log**: see a history of status changes, edits, assignments, and label updates

## Tech Stack

| Layer    | Tool                                   |
| -------- | -------------------------------------- |
| UI       | React 19                               |
| Routing  | React Router 7                         |
| Build    | Vite                                   |
| Backend  | Supabase (Postgres, Auth, Row Level Security) |

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A [Supabase](https://supabase.com) project with **Anonymous Sign-Ins** enabled (Authentication > Providers)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

You can find both values in your Supabase dashboard under **Project Settings > API**.

### 3. Run the app

```bash
npm run dev
```

Then open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

## Database

The app expects the following tables in your Supabase project:

| Table               | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `profiles`          | Display name for each signed in user                 |
| `tasks`             | Title, description, status, priority, and due date   |
| `team_members`      | People a user has added to their team                |
| `labels`            | Colored labels owned by a user                       |
| `task_assignees`    | Links tasks to team members                          |
| `task_labels`       | Links tasks to labels                                |
| `comments`          | Comments posted on a task                            |
| `task_activity_log` | History of changes made to a task                    |

Ownership columns such as `user_id` are expected to default to `auth.uid()`, and Row Level Security policies should let users see their own tasks plus any tasks they are assigned to.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the local dev server           |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

## Project Structure

```
src/
  App.jsx          Routes for the login page and the board
  Login.jsx        Name based sign in
  TaskBoard.jsx    Main board, panels, filters, and drag and drop
  TaskDetail.jsx   Task editing, assignees, labels, comments, and activity
  Avatar.jsx       Team member avatar (image or colored initials)
  utils.js         Column definitions, due date helpers, activity text
  db.js            Supabase client
  App.css          Styles
```
