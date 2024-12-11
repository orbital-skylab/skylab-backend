"""
Steps:
1. Fill in the source_db_config and dest_db_config with the database details for migration
2. Run the file with python

Additional notes:
1. Destination database must have the required tables without any data before running this script.
2. Ensure theat the salt rounds for hashing in the new backend is set to 10 (so that the passwords are hashed correctly).
3. The psycopg module is required (pip install psycopg).
"""
import psycopg
from collections import defaultdict
from datetime import datetime, timezone, timedelta

# Database connection settings for source (old DB)
source_db_config = { # Database to read data from
    'dbname': 'name1',
    'user': 'postgres',
    'password': '',
    'host': '',
    'port': '5432'
}

# Database connection settings for destination (new DB)
dest_db_config = { # Database to write data to
    'dbname': 'name2',
    'user': 'postgres',
    'password': '',
    'host': '',
    'port': '5432'
}

# Constants for field positions in queries
USER_FIELDS = {
    "id": 0,
    "name": 1,
    "email": 2,
    "password": 3,
    "github_link": 4,
    "linkedin_link": 5,
    "blog_link": 6,
    "self_intro": 7,
    "matric_no": 8,
    "updated_at": 9,
}

# Timezone for cohorts
SINGAPORE_TZ = timedelta(hours=8)

# Fetch users
def fetch_users():
    """Fetch users from the source database."""
    query = """
        SELECT
            id, user_name, email, encrypted_password, github_link,
            linkedin_link, blog_link, self_introduction, matric_number, updated_at
        FROM users
    """
    return execute_fetch_query(query, "users")

# Remove duplicate users by keeping the most recently updated one
def remove_duplicate_users(users):
    """Remove duplicate users by email, keeping only the most recent one."""
    email_dict = defaultdict(list)

    # Group users by email
    for user in users:
        email_dict[user[USER_FIELDS["email"]]].append(user)

    # Keep the most recent user for each email
    unique_users = []
    for email, user_list in email_dict.items():
        if len(user_list) > 1:
            user_list.sort(key=lambda x: x[USER_FIELDS["updated_at"]], reverse=True)
            unique_users.append(user_list[0])
            print(f"Duplicate found for email: {email}. Keeping the most recent user.")
        else:
            unique_users.append(user_list[0])

    return unique_users

# Fetch roles and cohorts
def fetch_roles_and_cohorts(role_table):
    """Fetch roles and cohorts from role-specific tables."""
    if role_table == "students":
        query = """
            SELECT id, user_id, cohort, team_id
            FROM students
            WHERE cohort IS NOT NULL
        """
    else:
        query = f"""
            SELECT id, user_id, cohort
            FROM {role_table}
            WHERE cohort IS NOT NULL
        """
    return execute_fetch_query(query, role_table)

# Fetch teams
def fetch_teams():
    """Fetch teams from the source database."""
    query = """
        SELECT
            id, team_name, adviser_id, mentor_id, cohort, poster_link, video_link,
            has_dropped, project_level
        FROM teams
        WHERE cohort IS NOT NULL
    """
    return execute_fetch_query(query, "teams")

# Fetch milestones
def fetch_milestones():
    """Fetch milestones from the old database."""
    query = """
        SELECT id, submission_deadline, name, cohort, created_at, updated_at
        FROM milestones
    """
    return execute_fetch_query(query, "milestones")

# Fetch submissions
def fetch_submissions():
    """Fetch submissions from the old database."""
    query = """
        SELECT id, milestone_id, team_id, video_link, read_me, project_log, poster_link, updated_at
        FROM submissions
    """
    return execute_fetch_query(query, "submissions")

# Helper: Execute a fetch query and log results
def execute_fetch_query(query, table_name):
    """Execute a query to fetch data and log results."""
    try:
        with psycopg.connect(**source_db_config) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                rows = cursor.fetchall()
                print(f"Fetched {len(rows)} rows from {table_name}.")
                return rows
    except Exception as e:
        print(f"Error fetching data from {table_name}: {e}")
        return []

# Process administrator roles
def process_administrator_roles(admin_roles):
    """Process administrator roles, setting start and end dates for cohorts."""
    admin_mapping = defaultdict(list)

    # Group cohorts by user_id
    for _, user_id, cohort in admin_roles:
        if cohort is not None:
            admin_mapping[user_id].append(cohort)

    # Determine the start and end dates for each administrator
    processed_admin_roles = [
        {
            "userId": user_id,
            "startDate": datetime(min(cohorts), 1, 1) - SINGAPORE_TZ,
            "endDate": datetime(max(cohorts), 12, 31, 23, 59, 59) - SINGAPORE_TZ,
        }
        for user_id, cohorts in admin_mapping.items()
    ]
    return processed_admin_roles

# Add a cohort to the mapping
def add_to_cohort_mapping(cohort_mapping, cohort):
    """Add a cohort to the mapping if it doesn't exist."""
    if cohort not in cohort_mapping:
        cohort_mapping[cohort] = {
            "academicYear": cohort,
            "startDate": datetime(cohort, 1, 1) - SINGAPORE_TZ,
            "endDate": datetime(cohort, 12, 31, 23, 59, 59) - SINGAPORE_TZ,
        }

# Create a role entry
def create_role_entry(id, user_id, cohort, extra_fields=None):
    """Create a role entry with optional extra fields."""
    role_entry = {"id": id, "userId": user_id, "cohortYear": cohort}
    if extra_fields:
        role_entry.update(extra_fields)
    return role_entry

# Transform user, role, and cohort data
def transform_users_roles_cohorts_data(users, roles_with_cohorts):
    """Transform users, roles, and cohorts to fit the new schema."""
    cohort_mapping = {}
    transformed_roles = {"Administrator": [], "Adviser": [], "Mentor": [], "Student": []}
    transformed_users = []

    # Transform users
    for user in users:
        transformed_users.append({
            "id": user[USER_FIELDS["id"]],
            "name": user[USER_FIELDS["name"]],
            "email": user[USER_FIELDS["email"]],
            "password": user[USER_FIELDS["password"]],
            "githubUrl": user[USER_FIELDS["github_link"]],
            "linkedinUrl": user[USER_FIELDS["linkedin_link"]],
            "personalSiteUrl": user[USER_FIELDS["blog_link"]],
            "selfIntro": user[USER_FIELDS["self_intro"]],
            "matricNo": user[USER_FIELDS["matric_no"]] or None,
        })

    # Process roles
    for role_table, entries in roles_with_cohorts.items():
        if role_table == "Administrator":
            processed_admin_roles = process_administrator_roles(entries)
            transformed_roles["Administrator"].extend(processed_admin_roles)

            for _, _, cohort in entries:
                if cohort is not None:
                    add_to_cohort_mapping(cohort_mapping, cohort)
        else:
            for entry in entries:
                id, user_id, cohort, *extra = entry
                if cohort is not None:
                    add_to_cohort_mapping(cohort_mapping, cohort)
                    extra_fields = {}
                    if role_table == "Adviser":
                        extra_fields["matricNo"] = next((u[USER_FIELDS["matric_no"]] for u in users if u[USER_FIELDS["id"]] == user_id), None)
                    elif role_table == "Student":
                        extra_fields["matricNo"] = next((u[USER_FIELDS["matric_no"]] for u in users if u[USER_FIELDS["id"]] == user_id), None)
                        extra_fields["teamId"] = extra[0]
                    transformed_roles[role_table].append(create_role_entry(id, user_id, cohort, extra_fields))

    cohorts = list(cohort_mapping.values())
    print(f"Transformed {len(transformed_users)} users, {len(cohorts)} cohorts, and roles.")
    return transformed_users, transformed_roles, cohorts

# Transform teams
def transform_teams(teams):
    """Transform teams to fit the new Project schema."""
    def map_project_level(level):
        """Map project_level to achievement level."""
        return {0: "Vostok", 1: "Gemini", 2: "Apollo", 3: "Artemis"}.get(level, "Unknown")

    transformed_projects = [
        {
            "id": team[0],
            "name": team[1],
            "teamName": team[1],
            "adviserId": team[2],
            "mentorId": team[3],
            "cohortYear": team[4],
            "posterUrl": team[5],
            "videoUrl": team[6],
            "hasDropped": team[7],
            "achievement": map_project_level(team[8]),
        }
        for team in teams
    ]
    print(f"Transformed {len(transformed_projects)} teams into projects.")
    return transformed_projects

def transform_milestones(milestones):
    """Transform milestones data to fit the new Deadline schema."""
    transformed_deadlines = []
    for milestone in milestones:
        # Mapping the old milestone fields to the new schema
        id, submission_deadline, name, cohort, created_at, updated_at = milestone
        
        # Creating the deadline entry
        transformed_deadlines.append({
            "id": id,
            "name": name,
            "cohortYear": cohort,
            "dueBy": submission_deadline,
            "createdOn": created_at,
            "updatedAt": updated_at,
            "type": "Milestone",
        })
    
    print(f"Transformed {len(transformed_deadlines)} milestones into deadlines.")
    return transformed_deadlines

def transform_submissions(submissions):
    """Transform submissions data to fit the new Submission schema."""
    transformed_submissions = []
    for submission in submissions:
        id, milestone_id, team_id, video_link, read_me, project_log, show_public, poster_link = submission
        
        # Map to new schema
        transformed_submissions.append({
            "id": id,
            "deadlineId": milestone_id,
            "fromProjectId": team_id,    # Assuming team_id corresponds to fromProjectId
            "videoLink": video_link,
            "readMe": read_me,
            "projectLog": project_log,
            "showPublic": show_public,
            "posterLink": poster_link,
            "milestoneNumber": milestone_number,
        })
    
    print(f"Transformed {len(transformed_submissions)} submissions.")
    return transformed_submissions

def insert_cohorts(cursor, cohorts):
    """Insert cohorts into the Cohort table."""
    query = """
        INSERT INTO "Cohort" ("academicYear", "startDate", "endDate")
        VALUES (%s, %s, %s)
        ON CONFLICT ("academicYear") DO NOTHING
    """
    cursor.executemany(
        query,
        [(cohort["academicYear"], cohort["startDate"], cohort["endDate"]) for cohort in cohorts],
    )

def insert_users(cursor, users):
    """Insert users into the User table."""
    query = """
        INSERT INTO "User" (id, name, email, password, "githubUrl", "linkedinUrl", "personalSiteUrl", "selfIntro")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING
    """
    cursor.executemany(
        query,
        [
            (
                user["id"], user["name"], user["email"], user["password"],
                user["githubUrl"], user["linkedinUrl"], user["personalSiteUrl"], user["selfIntro"]
            )
            for user in users
        ],
    )

def insert_administrators(cursor, administrators):
    """Insert administrators into the Administrator table."""
    query = """
        INSERT INTO "Administrator" ("userId", "startDate", "endDate")
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    cursor.executemany(
        query,
        [(admin["userId"], admin["startDate"], admin["endDate"]) for admin in administrators],
    )

def insert_advisers(cursor, advisers):
    """Insert advisers into the Adviser table."""
    query = """
        INSERT INTO "Adviser" (id, "userId", "cohortYear", "matricNo")
        VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    cursor.executemany(
        query,
        [(adviser["id"], adviser["userId"], adviser["cohortYear"], adviser["matricNo"]) for adviser in advisers],
    )

def insert_mentors(cursor, mentors):
    """Insert mentors into the Mentor table."""
    query = """
        INSERT INTO "Mentor" (id, "userId", "cohortYear")
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    cursor.executemany(
        query,
        [(mentor["id"], mentor["userId"], mentor["cohortYear"]) for mentor in mentors],
    )

def insert_deadlines(cursor, deadlines):
    """Insert deadlines into the new database."""
    query = """
        INSERT INTO "Deadline" ("id", "name", "cohortYear", "dueBy", "createdOn", "updatedAt", "type")
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT ("name", "cohortYear") DO NOTHING
    """
    cursor.executemany(
        query,
        [
            (deadline["id"], deadline["name"], deadline["cohortYear"], deadline["dueBy"], deadline["createdOn"], deadline["updatedAt"], deadline["type"])
            for deadline in deadlines
        ],
    )

def insert_submissions(cursor, submissions):
    section_map = {}
    section_data = []
    question_data = []
    submission_data = []
    answer_data = []

    # For each submission, ensure sections and questions for the related deadline are present
    for submission in submissions:
        id, milestone_id, team_id, video_link, read_me, project_log, poster_link, updated_at = submission

        # If milestone_id (deadline id) hasn't been processed yet, create section and questions
        if milestone_id not in section_map:
            # Create section entry for the deadline
            section_data.append((milestone_id, "Section 1", 1, milestone_id))  # Section name, section number, and milestone_id

            # Create questions for this section
            question_data.append((milestone_id * 4, 1, "ReadMe", "ReadMe for milestone", "RichTextEditor", milestone_id))
            question_data.append((milestone_id * 4 - 1, 2, "Poster link", "Poster link for milestone", "Url", milestone_id))
            question_data.append((milestone_id * 4 - 2, 3, "Video link", "Video link for milestone", "Url", milestone_id))
            question_data.append((milestone_id * 4 - 3, 4, "Project log", "Project log for milestone", "RichTextEditor", milestone_id))

            section_map[milestone_id] = True

        # Prepare submission data
        submission_data.append((id, False, updated_at, team_id, milestone_id))  # False = draft, update the timestamp

        # Answer data based on milestone_id and submission ID
        if read_me:
            answer_data.append((milestone_id * 4, read_me, id))  # Question ID is calculated, answer for 'ReadMe'
        if poster_link:
            answer_data.append((milestone_id * 4 - 1, poster_link, id))  # Question ID for 'Poster Link'
        if video_link:
            answer_data.append((milestone_id * 4 - 2, video_link, id))  # Question ID for 'Video Link'
        if project_log:
            answer_data.append((milestone_id * 4 - 3, project_log, id))  # Question ID for 'Project Log'

    # Insert sections into the Section table
    section_query = """
        INSERT INTO "Section" ("id", "name", "sectionNumber", "deadlineId")
        VALUES (%s, %s, %s, %s)
        ON CONFLICT ("deadlineId", "sectionNumber") DO NOTHING
    """
    cursor.executemany(
        section_query,
        section_data,
    )

    # Insert questions into the Question table
    question_query = """
        INSERT INTO "Question" ("id", "questionNumber", "question", "desc", "type", "sectionId")
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(
        question_query,
        question_data,
    )

    # Insert submissions into the Submission table
    submission_query = """
        INSERT INTO "Submission" ("id", "isDraft", "updatedAt", "fromProjectId", "deadlineId")
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT ("id") DO NOTHING
    """
    cursor.executemany(
        submission_query,
        submission_data,
    )

    # Insert answers into the Answer table
    answer_query = """
        INSERT INTO "Answer" ("questionId", "answer", "submissionId")
        VALUES (%s, %s, %s)
        ON CONFLICT ("questionId", "submissionId") DO NOTHING
    """
    cursor.executemany(
        answer_query,
        answer_data,
    )

def write_users_cohort_roles_to_destination(users, roles, cohorts):
    """Write users, roles, and cohorts to the destination database."""
    try:
        with psycopg.connect(**dest_db_config) as conn:
            with conn.cursor() as cursor:
                # Insert cohorts
                insert_cohorts(cursor, cohorts)

                # Insert users
                insert_users(cursor, users)

                # Insert roles
                for role_table, entries in roles.items():
                    if role_table == "Administrator":
                        insert_administrators(cursor, entries)
                    elif role_table == "Adviser":
                        insert_advisers(cursor, entries)
                    elif role_table == "Mentor":
                        insert_mentors(cursor, entries)

                # Update sequence values for the tables
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"User"', 'id'), MAX(id)) FROM "User"''')
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Administrator"', 'id'), MAX(id)) FROM "Administrator"''')
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Adviser"', 'id'), MAX(id)) FROM "Adviser"''')
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Mentor"', 'id'), MAX(id)) FROM "Mentor"''')
                conn.commit()
                print(f"Inserted users, administrators, advisers, mentors, and cohorts.")
    except Exception as e:
        print(f"Error writing data to destination: {e}")

def write_projects_to_destination(projects):
    """Write projects into the Project table."""
    try:
        with psycopg.connect(**dest_db_config) as conn:
            with conn.cursor() as cursor:
                query = """
                    INSERT INTO "Project" (id, name, "teamName", "adviserId", "mentorId", "cohortYear",
                                           "posterUrl", "videoUrl", "hasDropped", achievement)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """
                cursor.executemany(
                    query,
                    [
                        (
                            project["id"], project["name"], project["teamName"], project["adviserId"],
                            project["mentorId"], project["cohortYear"], project["posterUrl"], project["videoUrl"],
                            project["hasDropped"], project["achievement"]
                        )
                        for project in projects
                    ],
                )

                # Update sequence value for the Project table
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Project"', 'id'), MAX(id)) FROM "Project"''')
                conn.commit()
                print(f"Inserted projects.")
    except Exception as e:
        print(f"Error inserting projects: {e}")

def write_students_to_destination(students):
    """Write students into the Student table."""
    try:
        with psycopg.connect(**dest_db_config) as conn:
            with conn.cursor() as cursor:
                query = """
                    INSERT INTO "Student" (id, "userId", "cohortYear", "matricNo", "projectId")
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """
                cursor.executemany(
                    query,
                    [
                        (student["id"], student["userId"], student["cohortYear"], student["matricNo"], student["teamId"])
                        for student in students
                    ],
                )

                # Update sequence value for the Student table
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Student"', 'id'), MAX(id)) FROM "Student"''')
                conn.commit()
                print(f"Inserted students.")
    except Exception as e:
        print(f"Error inserting students: {e}")

def write_deadlines_and_submissions(deadlines, submissions):
    """Write deadlines, sections, questions, submissions and answers to their tables."""
    try:
        with psycopg.connect(**dest_db_config) as conn:
            with conn.cursor() as cursor:
                # Insert deadlines
                insert_deadlines(cursor, deadlines)

                # Insert submissions
                insert_submissions(cursor, submissions)

                conn.commit()

                # Update sequence values for the tables
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Deadline"', 'id'), MAX(id)) FROM "Deadline"''')
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Section"', 'id'), MAX(id)) FROM "Section"''')
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Question"', 'id'), MAX(id)) FROM "Question"''')
                cursor.execute('''SELECT setval(pg_get_serial_sequence('"Submission"', 'id'), MAX(id)) FROM "Submission"''')
                print(f"Inserted deadlines and submissions.")
    except Exception as e:
        print(f"Error writing data to destination: {e}")

# Main Workflow
def main():
    print("Starting migration...")

    users = fetch_users()
    unique_users = remove_duplicate_users(users)

    roles_with_cohorts = {
        "Administrator": fetch_roles_and_cohorts("admins"),
        "Adviser": fetch_roles_and_cohorts("advisers"),
        "Mentor": fetch_roles_and_cohorts("mentors"),
        "Student": fetch_roles_and_cohorts("students"),
    }

    if unique_users:
        # Transform users, roles, and cohorts
        transformed_users, transformed_roles, cohorts = transform_users_roles_cohorts_data(unique_users, roles_with_cohorts)

        # Write users, cohorts, and other roles except Student
        write_users_cohort_roles_to_destination(
            transformed_users, {k: v for k, v in transformed_roles.items() if k != "Student"}, cohorts
        )

        # Fetch, transform, and write projects
        teams = fetch_teams()
        transformed_projects = transform_teams(teams)
        write_projects_to_destination(transformed_projects)

        # Write students (dependent on projects)
        write_students_to_destination(transformed_roles["Student"])

        # Fetch, transform, and write milestones and submissions
        milestones = fetch_milestones()
        submissions = fetch_submissions()
        transformed_deadlines = transform_milestones(milestones)
        write_deadlines_and_submissions(transformed_deadlines, submissions)

    else:
        print("No users found. Exiting.")
    print("Migration completed.")

if __name__ == "__main__":
    main()
