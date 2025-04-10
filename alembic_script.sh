#!/bin/bash

# Function to show menu options
show_menu() {
    echo "Select an option:"
    echo "1) Check Alembic history"
    echo "2) Generate a new migration"
    echo "3) Apply migrations"
    echo "4) Show current Alembic revision"
    echo "5) Reset Alembic version history (delete versions folder)"
    echo "6) Delete specific revision from alembic_version table"
    echo "7) Exit"
}

# Function to execute Alembic history command
check_history() {
    echo "Checking Alembic history..."
    alembic history --verbose
}

# Function to generate a new migration
generate_migration() {
    echo "Generating a new Alembic migration..."
    alembic revision --autogenerate -m "$1"
}

# Function to apply migrations
apply_migrations() {
    echo "Applying Alembic migrations..."
    alembic upgrade head
}

# Function to show the current Alembic revision
show_current_revision() {
    echo "Showing current Alembic revision..."
    alembic current
}

# Function to reset Alembic version history by deleting the versions folder
reset_versions_folder() {
    echo "Resetting Alembic versions folder..."
    rm -rf alembic/versions/
    echo "Versions folder reset. Now generate a fresh migration."
}

# Function to delete a specific revision from the alembic_version table
delete_revision() {
    echo "Deleting a specific revision from the alembic_version table..."
    sqlite3 database/astrellect.db "DELETE FROM alembic_version WHERE version_num = '$1';"
    echo "Revision $1 deleted from alembic_version table."
}

# Main script loop
while true; do
    show_menu
    read -p "Enter your choice (1-7): " choice
    case $choice in
        1)
            check_history
            ;;
        2)
            read -p "Enter migration message: " message
            generate_migration "$message"
            ;;
        3)
            apply_migrations
            ;;
        4)
            show_current_revision
            ;;
        5)
            reset_versions_folder
            ;;
        6)
            read -p "Enter revision ID to delete: " revision_id
            delete_revision "$revision_id"
            ;;
        7)
            echo "Exiting script."
            break
            ;;
        *)
            echo "Invalid choice. Please select a valid option."
            ;;
    esac
done
