-- migration for submissions table
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  institution TEXT NOT NULL,
  research_title TEXT NOT NULL,
  bionote TEXT NOT NULL,
  co_authors TEXT,
  keywords TEXT NOT NULL,
  status TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  abstract_name TEXT NOT NULL,
  abstract_html_url TEXT NOT NULL,
  abstract_download_url TEXT NOT NULL,
  proof_of_payment_name TEXT NOT NULL,
  proof_of_payment_html_url TEXT NOT NULL,
  proof_of_payment_download_url TEXT NOT NULL
);
