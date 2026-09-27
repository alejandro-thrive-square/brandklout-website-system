#!/bin/bash

# Create index files where there are none, should be run in the gallery root
find . -type d -exec sh -c 'test -z "$(find $1 -maxdepth 1 -name "*.php")" && echo "<?php ?>" > "$1/index.php"' sh {} \;

# Define code to add at start and end
start_code='<?php include_once $_SERVER["DOCUMENT_ROOTBOWIE"] . "/assets/inc/variables.php"; ?>'
end_code='<?php $path = __DIR__; include_once $_SERVER["DOCUMENT_ROOTBOWIE"] . "/gallery.php"; ?>'

# Function to process each PHP file
process_file() {
  local filename="$1"

  # Check if the file contains a closing PHP tag
  if grep -q "?>" "$filename"; then
    echo "Closing PHP tag exists in $filename."
  else
    echo "?>" >> "$filename"
    echo "Added closing PHP tag to $filename."
  fi

  # Add start and end code
  # Create a temporary file
  tmp_file=$(mktemp)

  # Add start code
  echo "$start_code" > "$tmp_file"

  # Append original file content
  cat "$filename" >> "$tmp_file"

  # Add end code
  echo "$end_code" >> "$tmp_file"

  # Replace original file with modified temporary file
  mv "$tmp_file" "$filename"
}

# Find all index.php files and process them
find . -type f -name "index.php" | while read -r file; do
  process_file "$file"
done
