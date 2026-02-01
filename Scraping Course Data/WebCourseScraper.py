"""
UTM Course Scraper
Scrapes and parses course data from the UTM Academic Calendar
"""

import requests
from bs4 import BeautifulSoup
import re
import json
from dataclasses import dataclass, asdict
from typing import List, Optional


# ============================================================
# Data Classes
# ============================================================

@dataclass
class Course:
    """Represents a UTM course"""
    code: str
    name: str
    description: Optional[str] = None
    prerequisites: Optional[str] = None
    corequisites: Optional[str] = None
    exclusions: Optional[str] = None
    recommended_prep: Optional[str] = None
    distribution: Optional[str] = None
    hours: Optional[str] = None
    delivery_mode: Optional[str] = None


# ============================================================
# Scraper Functions
# ============================================================

def get_html(url: str) -> dict | str:
    """
    Fetch HTML content from a URL.
    """
    try:
        response = requests.get(url)
        return {
            "status_code": response.status_code,
            "response_json": response.text
        }
    except requests.exceptions.RequestException as e:
        return "error: " + str(e)


def get_courses_page(page: int = 0, **filters) -> dict | str:
    """
    Fetch a specific page of courses with optional filters.
    """
    base_url = "https://utm.calendar.utoronto.ca/course-search"
    params = {"page": page}
    params.update(filters)

    try:
        response = requests.get(base_url, params=params)
        return {
            "status_code": response.status_code,
            "response_json": response.text
        }
    except requests.exceptions.RequestException as e:
        return "error: " + str(e)


# ============================================================
# Parser Functions
# ============================================================

def parse_courses(html: str) -> List[Course]:
    """Parse course information from HTML."""
    soup = BeautifulSoup(html, 'html.parser')
    courses = []

    course_headers = soup.find_all('h3', class_='js-views-accordion-group-header')

    for header in course_headers:
        course = _parse_course_block(header)
        if course:
            courses.append(course)

    return courses


def _parse_course_block(header) -> Optional[Course]:
    """Parse a single course block."""
    div = header.find('div', attrs={'aria-label': True})
    if not div:
        return None

    text = div.get_text(strip=True)
    match = re.match(r'([A-Z]{3}\d{3}[HY]\d)\s*[•]\s*(.+)', text)

    if not match:
        aria_label = div.get('aria-label', '')
        match = re.match(r'([A-Z]{3}\d{3}[HY]\d)\s*[-–]\s*(.+)', aria_label.strip())
        if not match:
            return None

    code = match.group(1)
    name = match.group(2).strip()

    details_div = header.find_next_sibling('div', class_='views-row')
    course = Course(code=code, name=name)

    if details_div:
        desc_div = details_div.find('div', class_='views-field-field-desc')
        if desc_div:
            field_content = desc_div.find('div', class_='field-content')
            if field_content:
                p_tag = field_content.find('p')
                if p_tag:
                    course.description = p_tag.get_text(strip=True)

        course.prerequisites = _extract_field(details_div, 'field-prerequisite')
        course.corequisites = _extract_field(details_div, 'field-corequisite')
        course.exclusions = _extract_field(details_div, 'field-exclusion')
        course.recommended_prep = _extract_field(details_div, 'field-recommended-preparation')
        course.distribution = _extract_field(details_div, 'field-distribution-requirements')
        course.hours = _extract_field(details_div, 'field-hours')
        course.delivery_mode = _extract_field(details_div, 'field-mode-of-delivery')

    return course


def _extract_field(container, field_class: str) -> Optional[str]:
    """Extract a field value from the course details."""
    span = container.find('span', class_=f'views-field-{field_class}')
    if span:
        content = span.find('span', class_='field-content')
        if content:
            return content.get_text(strip=True)
        content = span.find('div', class_='field-content')
        if content:
            return content.get_text(strip=True)
    return None


def get_total_pages(html: str) -> int:
    """Extract total number of pages from pagination."""
    soup = BeautifulSoup(html, 'html.parser')
    last_link = soup.find('li', class_='pager__item--last')
    if last_link:
        a_tag = last_link.find('a')
        if a_tag and 'href' in a_tag.attrs:
            match = re.search(r'page=(\d+)', a_tag['href'])
            if match:
                return int(match.group(1)) + 1
    return 1


def extract_course_names(html: str) -> List[tuple]:
    """Simple extraction of just course codes and names."""
    soup = BeautifulSoup(html, 'html.parser')
    courses = []

    headers = soup.find_all('h3', class_='js-views-accordion-group-header')
    for header in headers:
        div = header.find('div', attrs={'aria-label': True})
        if div:
            text = div.get_text(strip=True)
            match = re.match(r'([A-Z]{3}\d{3}[HY]\d)\s*[•]\s*(.+)', text)
            if match:
                courses.append((match.group(1), match.group(2)))

    return courses


# ============================================================
# Export Functions
# ============================================================

def to_json(courses: List[Course], indent: int = 2) -> str:
    """Convert courses to JSON string."""
    return json.dumps([asdict(c) for c in courses], indent=indent, ensure_ascii=False)


def to_csv(courses: List[Course]) -> str:
    """Convert courses to CSV string."""
    import csv
    from io import StringIO

    if not courses:
        return ""

    output = StringIO()
    fieldnames = list(asdict(courses[0]).keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for course in courses:
        writer.writerow(asdict(course))

    return output.getvalue()


# ============================================================
# High-Level API
# ============================================================

def scrape_all_courses(**filters) -> List[Course]:
    """
    Scrape ALL courses across all pages.
    Automatically detects the number of pages.
    """
    all_courses = []

    # Get first page to determine total pages
    result = get_courses_page(page=0, **filters)

    if isinstance(result, str):
        print(f"Error: {result}")
        return []

    html = result["response_json"]
    total_pages = get_total_pages(html)

    print(f"Found {total_pages} pages to scrape...")

    # Parse first page
    courses = parse_courses(html)
    all_courses.extend(courses)
    print(f"Page 1/{total_pages}: {len(courses)} courses")

    # Scrape remaining pages
    for page in range(1, total_pages):
        result = get_courses_page(page=page, **filters)
        if isinstance(result, str):
            print(f"Error on page {page + 1}: {result}")
            continue

        courses = parse_courses(result["response_json"])
        all_courses.extend(courses)
        print(f"Page {page + 1}/{total_pages}: {len(courses)} courses")

    return all_courses


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("UTM Course Scraper")
    print("=" * 60)

    # Scrape ALL courses from all pages
    print("\nScraping ALL courses from all pages...\n")
    all_courses = scrape_all_courses()

    print(f"\n{'=' * 60}")
    print(f"Total courses scraped: {len(all_courses)}")
    print("=" * 60)

    # Print all courses
    for course in all_courses:
        print(f"{course.code}: {course.name}")

    # Save to JSON
    with open("all_courses.json", "w", encoding="utf-8") as f:
        f.write(to_json(all_courses))
    print(f"\nSaved {len(all_courses)} courses to all_courses.json")

    # Save to CSV
    with open("all_courses.csv", "w", encoding="utf-8") as f:
        f.write(to_csv(all_courses))
    print(f"Saved {len(all_courses)} courses to all_courses.csv")

    print("\nDone!")