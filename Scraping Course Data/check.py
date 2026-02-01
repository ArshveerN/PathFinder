import json
import csv
import sys

def json_to_csv(input_file, output_file):
    # Read JSON data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print("No data found in JSON file")
        return

    # Get headers from the first object's keys
    headers = list(data[0].keys())

    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for course in data:
            row = []
            for header in headers:
                value = course.get(header)
                # Convert lists/dicts to string representation
                if isinstance(value, (list, dict)):
                    value = json.dumps(value)
                elif value is None:
                    value = ""
                row.append(value)
            writer.writerow(row)

    print(f"Successfully converted {len(data)} courses to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        json_to_csv(sys.argv[1], sys.argv[2])
    else:
        json_to_csv('all_courses_prereq.json', 'courses.csv')