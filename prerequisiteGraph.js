/**
 * Prerequisite Graph Builder
 * * This module parses the 'prerequisites_parsed' attribute from the 
 * all_courses_prereq.json file and constructs a Directed Graph.
 * * Data Format Reference:
 * - Simple: "ANT101H5"
 * - Complex: ["and", "ANT101H5", "BIO152H5"]
 * - Nested:  ["or", ["and", "A", "B"], "C"]
 */

import coursesData from './Scraping Course Data/all_courses_prereq.json' with { type: "json" };
import jobPaths from './jobPaths.js';
class PrereqGraph {
    constructor() {
        this.nodes = new Map(); // Stores course details
        this.edges = new Map(); // Stores adjacency list (Parent -> Children)
    }

    /**
     * Initialize the graph with the raw JSON data
     */
    build(data) {
        data.forEach(course => {
            this.addNode(course);
            
            if (course.prerequisites_parsed) {
                // We extract a flat list of dependencies to build the basic graph edges.
                // If you need to enforce strict logic (AND vs OR), you would use 
                // the 'prerequisites_parsed' tree directly during traversal.
                const dependencies = this.extractDependencies(course.prerequisites_parsed);
                
                dependencies.forEach(prereqCode => {
                    this.addEdge(prereqCode, course.code);
                });
            }
        });
    }

    addNode(course) {
        this.nodes.set(course.code, {
            name: course.name,
            description: course.description,
            // Keep the raw logic tree for advanced validation later
            logicTree: course.prerequisites_parsed 
        });
        
        if (!this.edges.has(course.code)) {
            this.edges.set(course.code, []);
        }
    }

    addEdge(fromNode, toNode) {
        // Ensure 'from' node exists (it might be a course not in our DB)
        if (!this.edges.has(fromNode)) {
            this.edges.set(fromNode, []);
        }
        
        // Avoid duplicates
        if (!this.edges.get(fromNode).includes(toNode)) {
            this.edges.get(fromNode).push(toNode);
        }
    }

    /**
     * RECURSIVE PARSER
     * Flattens the nested ["and", ["or", "A", "B"], "C"] structure 
     * into a simple list of codes ["A", "B", "C"] for graph linking.
     */
    extractDependencies(prereqNode) {
        let deps = [];

        // CASE 1: Null (No prerequisites)
        if (!prereqNode) return deps;

        // CASE 2: String (Single course code)
        if (typeof prereqNode === 'string') {
            // Clean the string if necessary (sometimes whitespace creeps in)
            return [prereqNode.trim()]; 
        }

        // CASE 3: Array (Logic structure)
        if (Array.isArray(prereqNode)) {
            // The first element is the operator ("and", "or"), skip it
            const operands = prereqNode.slice(1);

            operands.forEach(op => {
                // Recursively extract from children
                const childDeps = this.extractDependencies(op);
                deps = [...deps, ...childDeps];
            });
        }

        // Remove duplicates in the flat list
        return [...new Set(deps)];
    }

    /**
     * Utility: Find what opens up after taking a specific course
     */
    getUnlocks(courseCode) {
        return this.edges.get(courseCode) || [];
    }

    /**
     * Utility: Get direct requirements for a course
     */
    getRequirements(courseCode) {
        const course = this.nodes.get(courseCode);
        if (!course) return null;
        return course.logicTree;
    }


    // =========================================================================
    /**
     * Helper: Returns a flat list of ALL requirements for a single course
     */
    getFlatRequirements(courseCode) {
        const node = this.nodes.get(courseCode);
        if (!node || !node.logicTree) return [];
        return this.extractDependencies(node.logicTree);
    }

    /**
     * Prints the dependency graph specifically for a named Career Path.
     */
    printCareerPathGraph(pathName, jobPathsObject) {
        // Access the specific list from the jobPaths object
        const pathCourses = jobPathsObject[pathName];

        if (!pathCourses) {
            console.log(`Error: Career path "${pathName}" not found.`);
            return;
        }

        console.log(`\n=== CAREER PATH GRAPH: ${pathName.toUpperCase()} ===`);
        console.log(`Total Courses: ${pathCourses.length}\n`);

        const sortedCourses = pathCourses.sort();

        sortedCourses.forEach(courseCode => {
            const requirements = this.getFlatRequirements(courseCode);
            
            // Filter requirements: Is the prereq INSIDE the path or EXTERNAL?
            const internalReqs = requirements.filter(r => pathCourses.includes(r));
            const externalReqs = requirements.filter(r => !pathCourses.includes(r));

            // Print Logic
            if (requirements.length === 0) {
                console.log(`[+] ${courseCode}: No Prerequisites`);
            } else {
                console.log(`[|] ${courseCode} requires:`);
                if (internalReqs.length > 0) console.log(`    └─ In Path: ${internalReqs.join(', ')}`);
                if (externalReqs.length > 0) console.log(`    └─ External: ${externalReqs.join(', ')}`);
            }
        });
    }
}

// Usage Example
const graph = new PrereqGraph();
graph.build(coursesData);
// Run the print function for "Full Stack"
graph.printCareerPathGraph("Full Stack", jobPaths);



export default graph;