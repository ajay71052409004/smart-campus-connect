-- Run this inside your database (npm run setup does it for you).

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  role          ENUM('student','staff') NOT NULL,
  login_id      VARCHAR(30)  NOT NULL UNIQUE,   -- register number or staff ID
  name          VARCHAR(80)  NOT NULL,
  department    VARCHAR(40)  NOT NULL,
  year          TINYINT NULL,                   -- students only (1-4)
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  leave_type    VARCHAR(30) NOT NULL,
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  days          SMALLINT NOT NULL,
  reason        TEXT NOT NULL,
  status        ENUM('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  staff_id      INT NULL,                       -- who approved / rejected
  staff_remark  VARCHAR(300) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at    DATETIME NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id)   REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);
